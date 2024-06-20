import React from 'react';
import Button from '../base/button';
import { PencilSquareIcon } from '@heroicons/react/20/solid';
import { t } from 'i18next';
import TryToAsk from '../chat/try-to-ask';

function ContextUI({
    startNewConversation,
    suggestedQuestions,
    isShowSuggestion,
    onSend,
}) {
    return (
        <div className="context-container flex flex-col justify-center">
            <div className='flex justify-center space-x-3 mt-1 '>
                <Button
                    onClick={() => startNewConversation()}
                    className="group block !h-9 bg-white-200 items-right text-sm mt-auto font-bold border border-black-500">
                    {t('app.chat.reselectCourses')}
                </Button>
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
        </div>
    );
}

export default ContextUI;
