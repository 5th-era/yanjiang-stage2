'use client'
import type { FC } from 'react'
import React, { useEffect, useRef } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import Textarea from 'rc-textarea'
import s from './style.module.css'
import Answer from './answer'
import Question from './question'
import type { FeedbackFunc } from './type'
import type { ChatItem, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Tooltip from '@/app/components/base/tooltip'
import Toast from '@/app/components/base/toast'
import ChatImageUploader from '@/app/components/base/image-uploader/chat-image-uploader'
import ImageList from '@/app/components/base/image-uploader/image-list'
import { useImageFiles } from '@/app/components/base/image-uploader/hooks'
import { XCircle } from '@/app/components/base/icons/solid/general'
import TryToAsk from '@/app/components/chat/try-to-ask'

export type IChatProps = {
  chatList: ChatItem[]
  /**
   * Whether to display the editing area and rating status
   */
  feedbackDisabled?: boolean
  /**
   * Whether to display the input area
   */
  isHideSendInput?: boolean
  onFeedback?: FeedbackFunc
  checkCanSend?: () => boolean
  onSend?: (message: string, files: VisionFile[]) => void
  useCurrentUserAvatar?: boolean
  isResponsing?: boolean
  controlClearQuery?: number
  visionConfig?: VisionSettings
  files,
  onUpload,
  onRemove,
  onReUpload,
  onImageLinkLoadError,
  onImageLinkLoadSuccess,
  onClear,
  suggestedQuestions,
  isShowSuggestion,
  player,
  updateContextUI,
  currInputs,
}

const Chat: FC<IChatProps> = ({
  chatList,
  feedbackDisabled = false,
  isHideSendInput = false,
  onFeedback,
  checkCanSend,
  onSend = () => { },
  useCurrentUserAvatar,
  isResponsing,
  controlClearQuery,
  visionConfig,
  files,
  onUpload,
  onRemove,
  onReUpload,
  onImageLinkLoadError,
  onImageLinkLoadSuccess,
  onClear,
  suggestedQuestions,
  isShowSuggestion,
  player,
  updateContextUI,
  currInputs,
}) => {
  const { t } = useTranslation()
  const { notify } = Toast
  const isUseInputMethod = useRef(false)

  const [query, setQuery] = React.useState('')

  const handleContentChange = (e: any) => {
    const value = e.target.value
    setQuery(value)
  }

  const getCurrentTime = () => {
    if (player) {
      return player.currentTime().toFixed(2);
    }
  };

  const logError = (message: string) => {
    notify({ type: 'error', message, duration: 3000 })
  }

  const valid = () => {
    if (!query || query.trim() === '') {
      logError('Message cannot be empty')
      return false
    }
    return true
  }

  useEffect(() => {
    if (controlClearQuery)
      setQuery('')
  }, [controlClearQuery])
  // const {
  //   files,
  //   onUpload,
  //   onRemove,
  //   onReUpload,
  //   onImageLinkLoadError,
  //   onImageLinkLoadSuccess,
  //   onClear,
  // } = useImageFiles()

  const containerRef = useRef(null);
  // 使用 useEffect 在 chatList 更新时滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      // 将滚动条滚动到容器的底部
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatList, files]); // chatList 是依赖项，当它变化时，useEffect 函数将重新执行

  const handleSend = () => {
    if (!valid() || (checkCanSend && !checkCanSend()))
      return
    const query1 = `当前视频时间戳：${getCurrentTime()} \n ${query}`
    // console.log(query1)
    onSend(query1, files.filter(file => file.progress !== -1).map(fileItem => ({
      type: 'image',
      transfer_method: fileItem.type,
      url: fileItem.url,
      upload_file_id: fileItem.fileId,
    })))
    if (!files.find(item => item.type === TransferMethod.local_file && !item.fileId)) {
      if (files.length)
        onClear()
      if (!isResponsing)
        setQuery('')
    }
  }

  const handleKeyUp = (e: any) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      // prevent send message when using input method enter
      if (!e.shiftKey && !isUseInputMethod.current)
        handleSend()
    }
  }

  const handleKeyDown = (e: any) => {
    isUseInputMethod.current = e.nativeEvent.isComposing
    if (e.code === 'Enter' && !e.shiftKey) {
      setQuery(query.replace(/\n$/, ''))
      e.preventDefault()
    }
  }

  return (
    <div className={cn(!feedbackDisabled && 'px-3.5', 'h-full', 'flex', 'flex-col')}>
      {/* Chat List */}
      <div ref={containerRef} className="space-y-[30px] mb-10 overflow-y-auto overflow-x-hidden">
        {chatList.map((item) => {
          if (item.isAnswer) {
            const isLast = item.id === chatList[chatList.length - 1].id
            return <Answer
              key={item.id}
              item={item}
              feedbackDisabled={feedbackDisabled}
              onFeedback={onFeedback}
              isResponsing={isResponsing && isLast}
            />
          }
          return (
            <Question
              key={item.id}
              id={item.id}
              // content={item.content}
              content={item.content.split('\n').filter(line => !line.startsWith("当前视频时间戳")).join('\n')}
              useCurrentUserAvatar={useCurrentUserAvatar}
              imgSrcs={(item.message_files && item.message_files?.length > 0) ? item.message_files.map(item => item.url) : []}
            />
          )
        })}
      </div>
      {/* {
        isShowSuggestion && !!suggestedQuestions?.length && (
          <TryToAsk
            suggestedQuestions={suggestedQuestions}
            onSend={onSend}
          />
        )
      } */}
      {
        !isHideSendInput && (
          <div className={cn(!feedbackDisabled && '!left-3.5 !right-3.5', 'z-10 bottom-0 left-0 right-0 mt-auto')}>
            <div className='p-[5.5px] max-h-[150px] bg-white border-[2.5px] border-yellow-600 rounded-xl overflow-y-auto'>
              {
                visionConfig?.enabled && (
                  <>
                    {/* <div className='bottom-2 left-2 flex items-center'>
                      <ChatImageUploader
                        settings={visionConfig}
                        onUpload={onUpload}
                        disabled={files.length >= visionConfig.number_limits}
                      />
                      <div className='mx-1 w-[1px] h-4 bg-black/5' />
                    </div> */}
                    <div className='pl-[52px]'>
                      <ImageList
                        list={files}
                        onRemove={onRemove}
                        onReUpload={onReUpload}
                        onImageLinkLoadSuccess={onImageLinkLoadSuccess}
                        onImageLinkLoadError={onImageLinkLoadError}
                      />
                    </div>
                  </>
                )
              }
              <div className='flex items-center justify-between'>
                <Textarea
                  className={`
                  block w-full px-2 pr-[118px] py-[7px] leading-5 max-h-none text-sm text-gray-700 outline-none appearance-none resize-none 
                  ${visionConfig?.enabled && 'pl-12'}
                `}
                  value={query}
                  onChange={handleContentChange}
                  onKeyUp={handleKeyUp}
                  onKeyDown={handleKeyDown}
                  autoSize
                  placeholder="有问题，直接问。"
                  style={{ fontSize: '20px', fontWeight: 'bold' }}
                />
                <div className="bottom-2 right-6 flex items-center h-8">
                  <div className={`${s.count} mr-4 h-5 leading-5 text-sm bg-gray-50 text-gray-500`}>{query.trim().length}</div>
                  {
                    query
                      ? (
                        <div className='flex justify-center items-center ml-2 w-8 h-8 cursor-pointer hover:bg-gray-100 rounded-lg' onClick={() => setQuery('')}>
                          <XCircle className='w-4 h-4 text-[#98A2B3]' />
                        </div>
                      )
                      : false
                        ? (
                          <div
                            className='group flex justify-center items-center ml-2 w-10 h-10 hover:bg-primary-50 rounded-lg cursor-pointer'
                            onClick={handleVoiceInputShow}
                          >
                            <Microphone01 className='block w-10 h-10 text-gray-500 group-hover:hidden' />
                            <Microphone01Solid className='hidden w-10 h-10 text-primary-600 group-hover:block' />
                          </div>
                        )
                        : null
                  }
                  <Tooltip
                    selector='send-tip'
                    htmlContent={
                      <div>
                        <div>{t('common.operation.send')} Enter</div>
                        <div>{t('common.operation.lineBreak')} Shift Enter</div>
                      </div>
                    }
                  >
                    <div className={`${s.sendBtn} w-10 h-10 cursor-pointer rounded-md`} onClick={handleSend}></div>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default React.memo(Chat)
