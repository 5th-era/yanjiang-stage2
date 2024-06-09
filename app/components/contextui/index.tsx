import React from 'react';
import Button from '../base/button';
import { PencilSquareIcon } from '@heroicons/react/20/solid';
import { t } from 'i18next';

function ContextUI({ startNewConversation }: { startNewConversation: () => void }) {
    return (
        <div className="context-container">
            <Button
                onClick={() => startNewConversation()}
                className="group block !h-9 text-primary-600 items-right text-sm mt-auto">
                <PencilSquareIcon className="mr-2 h-4 w-4" /> {t('app.chat.reselectCourses')}
            </Button>
        </div>
    );
}

export default ContextUI;
