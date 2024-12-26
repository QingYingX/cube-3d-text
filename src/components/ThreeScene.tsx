import React, { Suspense, useRef, useState, useEffect, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import Text3D from "./Text3D";
import { Text3DData } from "../types/text";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { useThree } from "@react-three/fiber";
import { useMessage } from "../contexts/MessageContext";
import { useLanguage } from "../language";
import customFontsStore from "../utils/localForageInstance.ts";

interface ThreeSceneProps {
    texts: Text3DData[];
    fontUrl: string;
    globalTextureYOffset: number;
}

const cachedFonts : {[id: string]: Font} = {}

export interface ThreeSceneHandle {
    groupRef: React.RefObject<THREE.Group>;
}

const ThreeScene = forwardRef<ThreeSceneHandle, ThreeSceneProps>(({ texts, fontUrl, globalTextureYOffset }, ref) => {

    const groupRef = useRef<THREE.Group>(null);

    useImperativeHandle(ref, () => ({
        groupRef
    }));

    const { gLang } = useLanguage();
    
    const text1Ref = useRef<THREE.Group>(null);
    const text2Ref = useRef<THREE.Group>(null);

    const messageApi = useMessage();


    const [, setSelectedObjects] = useState<THREE.Object3D[]>([]);
    const [font, setFont] = useState<Font | null>(null);

    useEffect(() => {
        if (cachedFonts[fontUrl]) {
            setFont(cachedFonts[fontUrl]);
            return;
        }
        // 加载字体
        const fontLoader = new FontLoader();
        if (fontUrl.startsWith("custom:")) {
            // 从本地存储加载字体
            customFontsStore.getItem(fontUrl.replace("custom:", "")).then(fontData => {
                if (!fontData || typeof fontData !== "string") {
                    return;
                }
                const fontJson = JSON.parse(fontData);
                const font = fontLoader.parse(fontJson);
                setFont(font);
                cachedFonts[fontUrl] = font;
            });
        } else {
            // 从网络加载字体
            const startTime = Date.now();
            fontLoader.load(
                fontUrl,
                (font) => {
                    setFont(font);
                    cachedFonts[fontUrl] = font;
                    const now = Date.now();
                    if (now - startTime > 1000) {
                        messageApi?.open({
                            key: 'loadingFont',
                            type: 'success',
                            content: gLang('fontSuccess'),
                            duration: 2,
                        });
                    }
                },
                (progress) => {
                    const now = Date.now();
                    if (now - startTime > 1000) {
                        messageApi?.open({
                            key: 'loadingFont',
                            type: 'loading',
                            content: gLang('fontLoading') + Math.round(progress.loaded),
                            duration: 60,
                        });
                    }
                }
            );
        }
    }, [fontUrl, gLang, messageApi]); // 每次 fontUrl 变化时重新加载字体

    const { scene } = useThree();

    useEffect(() => {
        // 确保场景背景为透明
        scene.background = null;
    }, [scene]);

    useEffect(() => {
        if (text1Ref.current && text2Ref.current) {
            setSelectedObjects([text1Ref.current, text2Ref.current]);
        }
    }, [text1Ref, text2Ref]);

    return (
        <>
            {/* 添加光源 */}
            {/*<ambientLight intensity={3.0}/>
            <directionalLight
                position={[0, 50, 50]}
                intensity={1.0}
                ref={(light) => light && light.lookAt(new THREE.Vector3(0, 0, 0))}
            />*/}

            {/* 创建文本网格 */}
            <Suspense fallback={<Html>Loading...</Html>}>
                {font && (
                    <group ref={groupRef}>
                        {texts.map((text, index) => (
                            <Text3D
                                key={index}
                                content={text.content}
                                opts={text.opts}
                                globalTextureYOffset={globalTextureYOffset}
                                font={font}
                                position={[0, text.opts.y, 0]}
                                rotation={[text.opts.rotY * (Math.PI / 180), 0, 0]}
                            />
                        ))}
                    </group>
                )}
            </Suspense>

            {/* 添加描边效果 */}
            {/*<OutlineEffect*/}
            {/*    edgeColor={new THREE.Color(0xff0000)}*/}
            {/*    thickness={5.0}*/}
            {/*    outlineObjects={selectedObjects}*/}
            {/*/>*/}
        </>
    );
});

export default ThreeScene;