import React, { forwardRef, useImperativeHandle } from 'react';
import Button from '../base/button';
import { PencilSquareIcon } from '@heroicons/react/20/solid';
import { t } from 'i18next';
import TryToAsk from '../chat/try-to-ask';
import { updateContextUI } from '@/service';
import { ChatItem } from '@/types/app';
import PPT_contents from '../../../public/class/PPT_contents.json'
import Video_chapters from '../../../public/class/video_chapters.json'
import Transcript_contents from '../../../public/class/transcript_contents.json'

const ContextUI = forwardRef(({
    startNewConversation,
    suggestedQuestions,
    isShowSuggestion,
    onSend,
    updateContextUI,
    player,
    chatList,
    currInputs,
    activeModule,
    setActiveModule,
    questions_often,
}, ref) => {
    const [responseContent, setResponseContent] = React.useState([]);

    const handleButtonClick = (module: String) => {
        if (activeModule !== module) {
            setActiveModule(module);
        }
        if (module === "SpeechReviewOptimization" || module === "InteractWithTeacher") {
            player.pause()
        }
    };

    const parseTimeString = (timeString: String) => {
        const [minutes, seconds] = timeString.split(":").map(Number);
        return minutes * 60 + seconds;
    }

    const findContent = (timestamp: String, subject: String, type: String) => {
        let content = "";
        let contents = "PPT";
        if (type === "PPT") {
            contents = PPT_contents;
        }
        else if (type === "Video") {
            contents = Video_chapters;
        }
        else if (type === "Transcript") {
            contents = Transcript_contents;
        }

        if (!contents[subject]) {
            content = "Subject not found.";
            return content;
        }

        const timestampSeconds = parseInt(timestamp, 10);
        for (const section of contents[subject]) {
            const startSeconds = parseTimeString(section.start);
            const endSeconds = parseTimeString(section.end);
            if (timestampSeconds >= startSeconds && timestampSeconds <= endSeconds) {
                content = section.content.join("\n");
                return content;
            }
        }
        content = "No content available for this timestamp.";
        return content;
    }

    // answer
    const responseItem: ChatItem = {
        id: `${Date.now()}`,
        content: '',
        agent_thoughts: [],
        message_files: [],
        isAnswer: true,
    }
    const isAgentMode = true

    const data: Record<string, any> = {
        inputs: {},
        query: "",
        conversation_id: "",
    }

    const prepare_context_by_timestamp = () => {
        let current_time = `${getCurrentTime()}`
        let current_chat = []
        try {
            current_chat = chatList.slice(-2).map(item => item.content)
            if (current_chat[current_chat.length - 1] === "" && chatList.slice(-1)[0].agent_thoughts.length > 0) {
                current_chat[current_chat.length - 1] = chatList.slice(-1)[0].agent_thoughts.slice(-1)[0].thought
            }
            current_chat[current_chat.length - 2] = "Question:" + current_chat[current_chat.length - 2]
            current_chat[current_chat.length - 1] = "Answer:" + current_chat[current_chat.length - 1]
        } catch (error) {
            // console.error("Error parsing JSON:", error);
            // 这里可以添加更多的错误处理逻辑
        }

        let current_scene = " "
        if (currInputs && currInputs.scene === "自我介绍") {
            current_scene = "self_introduction"
        }
        else if (currInputs && currInputs.scene === "缓解紧张") {
            current_scene = "ease_tension"
        }
        else if (currInputs && currInputs.scene === "酒宴祝词") {
            current_scene = "banquet_toast"
        }
        const PPT_content = findContent(current_time, current_scene, "PPT")
        // console.log(PPT_content)
        const Video_content = findContent(current_time, current_scene, "Video")
        // console.log(Video_content)
        const Transcript_content = findContent(current_time, current_scene, "Transcript")
        // console.log(Transcript_content)

        data.inputs = {
            "scene": currInputs.scene,
        }

        const currentScene = `
当前演讲场景为：${currInputs.scene}
        `
        const query_ppt = `
当前课程的PPT内容为：
"""
${PPT_content}
"""
        `
        const query_video = `
当前的视频章节内容为：
"""
${Video_content}
"""
        `
        const query_transcript = `
当前课程的文字内容为：
"""
${Transcript_content}
"""
        `
        const query_QA = `
上一轮对话的内容为：
"""
${current_chat.join('\n')}
"""
        `

        return [currentScene, query_ppt, query_video, query_transcript, query_QA]
    }

    const prepare_context = (event) => {
        const [currentScene, query_ppt, query_video, query_transcript, query_QA] = prepare_context_by_timestamp();
        if (event === "chat_new") {
            data.query = `
${query_QA}
根据上面的上下文，帮助我预测接下来学员最有可能问的三个问题。
注意：
- 每个问题不超过10个字符
- 输出如下格式的数组：
    ["question1","question2","question3"]
- 产生的问题必须用中文
- 你需要帮助正在学习演讲的学员，从学员的角度思考接下来可能会提出的问题。
`
        }
        else if (event === "video_pause") {
            data.query = `
${query_ppt}
${query_transcript}
${query_video}
学员刚刚暂停了视频，请根据上面的的上下文，帮助我预测接下来学员最有可能问的问题，或者可能采取的动作。
注意：
- 每个问题不超过10个字符
- 输出如下格式的数组：
    ["question1","question2","question3"]
- 产生的问题必须用中文
- 你需要帮助正在学习演讲的学员，从学员的角度思考接下来可能会提出的问题。
`
        }
        else if (event === "video_seek") {
            data.query = `
${query_ppt}
${query_transcript}
${query_video}
学员刚刚拖动了视频，请根据上面的的上下文，帮助我预测接下来学员最有可能问的问题，或者可能采取的动作。
注意：
- 每个问题不超过10个字符
- 输出如下格式的数组：
    ["question1","question2","question3"]
- 产生的问题必须用中文
- 你需要帮助正在学习演讲的学员，从学员的角度思考接下来可能会提出的问题。
`
        }
        else if (event === "video_next_chapter") {
            data.query = `
${query_ppt}
${query_transcript}
${query_video}
视频进入了下一个章节，请根据上面的的上下文，帮助我预测接下来学员最有可能问的问题，或者可能采取的动作。
注意：
- 每个问题不超过10个字符
- 输出如下格式的数组：
    ["question1","question2","question3"]
- 产生的问题必须用中文
- 你需要帮助正在学习演讲的学员，从学员的角度思考接下来可能会提出的问题。
`
        }

        // console.log(data)
    }

    const update_contextUI = (event) => {
        if (activeModule != 'InteractiveLearning') {
            return
        }
        setResponseContent([])
        prepare_context(event)

        updateContextUI(data, {
            onData: (message: string, isFirstMessage: boolean, { conversationId: newConversationId, messageId, taskId }: any) => {
                responseItem.content = responseItem.content + message
                // console.log("onData:", responseItem.content)
                setResponseContent([])
            },
            async onCompleted(hasError?: boolean) {
                if (hasError)
                    return

                // console.log("onCompleted:", responseItem.content)                
                try {
                    setResponseContent(JSON.parse(responseItem.content))
                } catch (error) {
                    console.error("Error parsing JSON:", error);
                    // 这里可以添加更多的错误处理逻辑
                }
            },
        })
    }

    const getCurrentTime = () => {
        if (player) {
            return player.currentTime().toFixed(2);
        }
    };

    useImperativeHandle(ref, () => ({
        update_contextUI,
        prepare_context_by_timestamp
    }));

    return (
        <div className="context-container flex flex-col justify-center">
            <div className='flex items-center mt-0 mb-0 py-2'>
                <div
                    className='grow h-[1px]'
                    style={{
                        background: 'linear-gradient(270deg, #F3F4F6 0%, rgba(243, 244, 246, 0) 100%)',
                    }}
                />
                <div className='shrink-0 flex items-center px-3'>
                    <span className='text-xs text-gray-500 font-medium'>{t('app.chat.functionArea')}</span>
                </div>
                <div
                    className='grow h-[1px]'
                    style={{
                        background: 'linear-gradient(270deg, rgba(243, 244, 246, 0) 0%, #F3F4F6 100%)',
                    }}
                />
            </div>
            <div className='flex justify-center space-x-3 mt-0'>
                <Button
                    onClick={() => startNewConversation()}
                    className="group block !h-9 bg-white-200 items-right text-sm mt-auto border border-black-500 text-primary-600">
                    {t('app.chat.reselectCourses')}
                </Button>
                <Button
                    onClick={() => handleButtonClick('InteractiveLearning')}
                    disabled={activeModule === 'InteractiveLearning'}
                    className={`group block !h-9 bg-white-200 items-right text-sm mt-auto border border-black-500 text-primary-600 ${activeModule === 'InteractiveLearning' ? 'bg-blue-100' : ''}`}>
                    {t('app.chat.InteractiveLearning')}
                </Button>
                <Button
                    onClick={() => handleButtonClick('SpeechReviewOptimization')}
                    disabled={activeModule === 'SpeechReviewOptimization'}
                    className={`group block !h-9 bg-white-200 items-right text-sm mt-auto border border-black-500 text-primary-600 ${activeModule === 'SpeechReviewOptimization' ? 'bg-blue-100' : ''}`}>
                    {t('app.chat.SpeechReviewOptimization')}
                </Button>
                <Button
                    onClick={() => handleButtonClick('InteractWithTeacher')}
                    disabled={activeModule === 'InteractWithTeacher'}
                    className={`group block !h-9 bg-white-200 items-right text-sm mt-auto border border-black-500 text-primary-600 ${activeModule === 'InteractWithTeacher' ? 'bg-blue-100' : ''}`}>
                    {t('app.chat.InteractWithTeacher')}
                </Button>
                {/* <Button
                    onClick={() => update_contextUI("你好啊boy", "test")}
                    className="group block !h-9 bg-white-200 items-right text-sm mt-auto font-bold border border-black-500">
                    {t('app.chat.reselectCourses')}
                </Button> */}
                {/* <Button
                    onClick={() => {
                        document.getElementById('screenshotButton').click();
                    }}
                    className="group block !h-9 bg-white-200 items-right text-sm mt-auto font-bold  border border-red-500">
                    {t('app.chat.screenShot')}
                </Button> */}
            </div>
            {/* <div className='flex justify-center space-x-3 mb-3 '>
                {
                    isShowSuggestion && !!suggestedQuestions?.length && (
                        <TryToAsk
                            suggestedQuestions={suggestedQuestions}
                            onSend={onSend}
                        />
                    )
                }
            </div> */}
            <div className="flex justify-center space-x-3 mb-3">
                {/* <label>{responseContent}</label> */}
                {
                    (!!responseContent?.length || !!questions_often[activeModule]?.length) && (
                        <TryToAsk
                            suggestedQuestions={activeModule === "InteractiveLearning" ? responseContent : []}
                            onSend={onSend}
                            questions_often={questions_often[activeModule]}
                        />
                    )
                }
            </div>
        </div>
    );
});

export default ContextUI;
