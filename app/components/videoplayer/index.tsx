import React from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export const VideoPlayer = (props) => {
    const videoRef = React.useRef(null);
    const playerRef = React.useRef(null);
    const { options, onReady } = props;

    React.useEffect(() => {
        // Make sure Video.js player is only initialized once
        if (!playerRef.current) {
            // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode. 
            const videoElement = document.createElement("video-js");

            videoElement.classList.add('vjs-big-play-centered');
            videoRef.current.appendChild(videoElement);

            const player = playerRef.current = videojs(videoElement, options, () => {
                videojs.log('player is ready');
                onReady && onReady(player);
            });

            // You could update an existing player in the `else` block here
            // on prop change, for example:
        } else {
            const player = playerRef.current;

            // player.autoplay(options.autoplay);
            // player.src(options.sources);
        }
    }, [options, onReady]);

    React.useEffect(() => {
        const player = playerRef.current;

        // 键盘事件处理函数
        const handleKeyDown = (event) => {
            if (event.code === 'Space') {
                event.preventDefault(); // 防止页面滚动

                // // 切换全屏状态
                // if (player.isFullscreen()) {
                //     player.exitFullscreen();
                // } else {
                //     player.requestFullscreen();
                // }

                // 切换播放状态
                if (player.paused()) {
                    player.play();
                } else {
                    player.pause();
                }
            }
        };

        // 监听键盘事件
        document.addEventListener('keydown', handleKeyDown);

        // 清理事件监听器
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Dispose the Video.js player when the functional component unmounts
    React.useEffect(() => {
        const player = playerRef.current;

        return () => {
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, [playerRef]);

    return (
        <div className='video-player-container interaction-mode'>
            <div data-vjs-player>
                <div ref={videoRef} />
            </div>
        </div>
    );
}

export default VideoPlayer;
