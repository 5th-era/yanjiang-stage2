import React from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { TransferMethod } from '@/types/app'
import { imageUpload } from '../base/image-uploader/utils';

export const VideoPlayer = (props) => {
    const videoRef = React.useRef(null);
    const playerRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const imgRef = React.useRef(null);
    const { options, onReady, onUpload, files } = props;

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
                // if (player.paused()) {
                //     player.play();
                // } else {
                //     player.pause();
                // }
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

    // const videoElement = playerRef.current.el().getElementsByTagName('video')[0];

    const handleScreenshot = () => {
        try {
            const videoElement = playerRef.current.el().getElementsByTagName('video')[0];
            const canvas = canvasRef.current;

            const context = canvas.getContext('2d');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            const dataURL = canvas.toDataURL('image/png');
            // console.log('Screenshot URL:', dataURL);
            // img.src = dataURL;
            // img.style.display = 'block';

            const byteString = atob(dataURL.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ia], { type: 'image/jpeg' });
            const file = new File([blob], 'screenshot.jpg', { type: 'image/jpeg' });

            // 下载文件以便检查
            // const link = document.createElement('a');
            // link.href = URL.createObjectURL(blob);
            // link.download = 'screenshot.jpg';
            // document.body.appendChild(link);
            // link.click();
            // document.body.removeChild(link);

            // 调用 onUpload 回调，将截屏文件传递
            // console.log("list.length: ", files.length)
            if (files.length > 0) {
                alert('注意，只能获取一张课件的截图，请先删除先前的课件截图.');
            } else {
                const imageFile = {
                    type: TransferMethod.local_file,
                    _id: `${Date.now()}`,
                    fileId: '',
                    file,
                    url: dataURL as string,
                    base64Url: dataURL as string,
                    progress: 0,
                }
                imageUpload({
                    file: imageFile.file,
                    onProgressCallback: (progress) => {
                        onUpload({ ...imageFile, progress })
                    },
                    onSuccessCallback: (res) => {
                        onUpload({ ...imageFile, fileId: res.id, progress: 100 })
                    },
                    onErrorCallback: () => {
                        onUpload({ ...imageFile, progress: -1 })
                    },
                })
            }

        } catch (err) {
            console.error('Error taking screenshot:', err);
        }
    };

    return (
        <div className='video-player-container interaction-mode'>
            <div data-vjs-player>
                <div ref={videoRef} />
            </div>
            <button id="screenshotButton" style={{ display: 'none' }} onClick={handleScreenshot}>Take Screenshot</button>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            <img ref={imgRef} alt="Screenshot" style={{ display: 'none' }} />
        </div>
    );
}

export default VideoPlayer;
