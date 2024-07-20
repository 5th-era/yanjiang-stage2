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
    const lastChapterRef = React.useRef(null);

    const { options, onReady, onUpload, files, updateContextUI, currInputs } = props;
    const [videoDuration, setVideoDuration] = React.useState(0);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [hoveredChapter, setHoveredChapter] = React.useState(null);
    const timeoutRef = React.useRef(null);

    React.useEffect(() => {
        // Make sure Video.js player is only initialized once
        if (!playerRef.current && options.sources[0].src != "") {
            // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode. 
            const videoElement = document.createElement("video-js");

            videoElement.classList.add('vjs-big-play-centered');
            videoRef.current.appendChild(videoElement);

            const player = playerRef.current = videojs(videoElement, {
                ...options,
                muted: false,  // 初始设置为非静音
                playsinline: true,  // 启用iOS上的内联播放
                autoplay: false,  // 禁用自动播放
            }, () => {
                // videojs.log('player is ready');
                onReady && onReady(player);

            });

            // Add touch event listener to unmute
            // videoElement.addEventListener('touchstart', () => {
            //     if (player.muted()) {
            //         player.muted(false);
            //     }
            // }, { once: true });

            player.on('loadedmetadata', () => {
                setVideoDuration(player.duration());
            });

            player.on('timeupdate', () => {
                const currentTime = player.currentTime();
                setCurrentTime(currentTime);

                // Check if the current time is within the next chapter
                if (options.chapters) {
                    // console.log(options.chapters);
                    for (let i = 0; i < options.chapters.length; i++) {
                        const chapter = options.chapters[i];
                        const nextChapter = options.chapters[i + 1];
                        const chapterEnd = nextChapter ? nextChapter.time : videoDuration;

                        if (currentTime >= chapter.time && currentTime < chapterEnd) {
                            if (lastChapterRef.current !== i) {
                                if (timeoutRef.current) {
                                    clearTimeout(timeoutRef.current);
                                }
                                timeoutRef.current = setTimeout(() => {
                                    updateContextUI("video_next_chapter");
                                    timeoutRef.current = null; // 清除 timeoutRef 的值
                                }, 300);
                                // console.log("Enter next chapter:", chapter.label);                                
                                lastChapterRef.current = i;
                            }
                            break;
                        }
                    }
                }
            });

            // 监听暂停事件
            player.on('pause', () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(() => {
                    updateContextUI("video_pause");
                    timeoutRef.current = null; // 清除 timeoutRef 的值
                }, 300);
            });

            player.on('seeked', () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(() => {
                    updateContextUI("video_seek");
                    timeoutRef.current = null; // 清除 timeoutRef 的值
                }, 300);
            });

            // // 添加点击事件监听器来启动播放
            // player.on('click', () => {
            //     console.log("got here.")
            //     if (player.paused()) {
            //         console.log("got here 1.")
            //         player.play().catch(error => {
            //             console.log("Playback was prevented. User interaction is needed to start playback.");
            //             // 在这里可以添加一个提示，告诉用户需要点击播放
            //         });
            //     } else {
            //         console.log("got here 2.")
            //         player.pause();
            //     }
            // });

            // 添加播放事件监听器
            player.on('play', () => {
                player.muted(false);  // 确保在播放时取消静音
            });

            // You could update an existing player in the `else` block here
            // on prop change, for example:
        } else {
            const player = playerRef.current;
        }

        const player = playerRef.current;
        if (player && options.sources && options.sources[0].src !== player.currentSrc()) {
            // console.log("Updating video source to:", options.sources[0].src, player.currentSrc(), player.src());
            player.pause();
            player.src(options.sources);
            player.load();
            // console.log("now source:", player.currentSrc(), player.src());
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

    const jumpTo = (time) => {
        if (playerRef.current) {
            playerRef.current.currentTime(time);
            playerRef.current.play();
        }
    };

    const getChapterBackground = (chapterStart, chapterEnd) => {
        if (currentTime >= chapterEnd) {
            return '#555'; // Fully played chapters are grey
        } else if (currentTime <= chapterStart) {
            return '#000'; // Not yet played chapters are black
        } else {
            const progress = ((currentTime - chapterStart) / (chapterEnd - chapterStart)) * 100;
            return `linear-gradient(to right, #555 ${progress}%, #000 ${progress}%)`;
        }
    };

    return (
        <div className='video-player-container interaction-mode'>
            <div data-vjs-player>
                <div ref={videoRef} />
            </div>
            {('chapters' in options &&
                <div>
                    <div className="chapters">
                        {options.chapters.map((chapter, index) => {
                            const nextChapter = options.chapters[index + 1];
                            const chapterEnd = nextChapter ? nextChapter.time : videoDuration;
                            const chapterDuration = chapterEnd - chapter.time;
                            const widthPercent = (chapterDuration / videoDuration) * 100;
                            const isHovered = hoveredChapter === index;
                            const marginRight = index < options.chapters.length - 1 ? 1 : 0; // 最后一个章节没有右侧边距

                            return (
                                <div
                                    key={index}
                                    onClick={() => jumpTo(chapter.time)}
                                    style={{
                                        flex: `0 0 calc(${widthPercent}% - ${1 / options.chapters.length}%)`, // 调整宽度以留出1px的空白
                                        cursor: 'pointer',
                                        transition: 'background-color 0.3s, color 0.3s',
                                        background: isHovered ? '#777' : getChapterBackground(chapter.time, chapterEnd),
                                        color: '#fff',
                                        textAlign: 'center',
                                        padding: '0px 0', // 仅顶部和底部填充
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                        position: 'relative',
                                        marginRight: `${marginRight}px`, // 添加1px的空白，除了最后一个章节
                                    }}
                                    title={chapter.label} // 使用title属性在悬停时显示完整文本
                                    onMouseEnter={() => setHoveredChapter(index)}
                                    onMouseLeave={() => setHoveredChapter(null)}
                                >
                                    {chapter.label}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            <button id="screenshotButton" style={{ display: 'none' }} onClick={handleScreenshot}>Take Screenshot</button>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            <img ref={imgRef} alt="Screenshot" style={{ display: 'none' }} />

        </div>
    );
}

export default VideoPlayer;
