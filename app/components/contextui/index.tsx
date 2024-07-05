import React, { forwardRef, useImperativeHandle } from 'react';
import Button from '../base/button';
import { PencilSquareIcon } from '@heroicons/react/20/solid';
import { t } from 'i18next';
import TryToAsk from '../chat/try-to-ask';
import { updateContextUI } from '@/service';
import { ChatItem } from '@/types/app';


const ContextUI = forwardRef(({
    startNewConversation,
    suggestedQuestions,
    isShowSuggestion,
    onSend,
    updateContextUI,
    player,
    chatList,
}, ref) => {
    const [responseContent, setResponseContent] = React.useState('');

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

    const prepare_context = (query, event) => {

        let current_time = `当前视频时间戳：${getCurrentTime()}`
        let current_chat = chatList.slice(-2).map(item => item.content)
        if (current_chat[current_chat.length - 1] === "" && chatList.slice(-1)[0].agent_thoughts.length > 0) {
            current_chat[current_chat.length - 1] = chatList.slice(-1)[0].agent_thoughts.slice(-1)[0].thought
        }

        data.inputs = {
            "current_time": current_time,
            "current_chat": current_chat.join('\n'),
            "event": event
        }

        data.query = query
        // console.log(data)
    }

    const update_contextUI = (query, event) => {
        prepare_context(query, event)

        updateContextUI(data, {
            onData: (message: string, isFirstMessage: boolean, { conversationId: newConversationId, messageId, taskId }: any) => {
                responseItem.content = responseItem.content + message
                // console.log("onData:", responseItem.content)
            },
            async onCompleted(hasError?: boolean) {
                if (hasError)
                    return

                setResponseContent(responseItem.content)
                // console.log("onCompleted:", responseItem.content)
            },
        })
    }

    const getCurrentTime = () => {
        if (player) {
            return player.currentTime().toFixed(2);
        }
    };

    useImperativeHandle(ref, () => ({
        update_contextUI
    }));

    return (
        <div className="context-container flex flex-col justify-center">
            <div className='flex justify-center space-x-3 mt-1 '>
                <Button
                    onClick={() => startNewConversation()}
                    className="group block !h-9 bg-white-200 items-right text-sm mt-auto font-bold border border-black-500">
                    {t('app.chat.reselectCourses')}
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
            <div className='flex justify-center space-x-3 mb-3 '>
                {
                    isShowSuggestion && !!suggestedQuestions?.length && (
                        <TryToAsk
                            suggestedQuestions={suggestedQuestions}
                            onSend={onSend}
                        />
                    )
                }
            </div>
            <div className="flex justify-center space-x-3 mb-3">
                <label>{responseContent}</label>
            </div>
        </div>
    );
});

export default ContextUI;
