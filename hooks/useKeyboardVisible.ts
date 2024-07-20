import { useState, useEffect } from 'react';

function useKeyboardVisible() {
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerHeight < window.outerHeight) {
                setKeyboardVisible(true);
            } else {
                setKeyboardVisible(false);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return isKeyboardVisible;
}

export default useKeyboardVisible;