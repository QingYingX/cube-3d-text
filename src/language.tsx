import React, { useContext, useState, useEffect, ReactNode } from "react";

type LanguageConfig = {
    [key: string]: string | LanguageConfig;
};

type LanguageParams = { [key: string]: string | number };

type LanguageContextType = {
    language: string;
    setLanguage: (lang: string) => void;
    gLang: (path: string, params?: LanguageParams) => string;
};


export const languageConfig: Readonly<LanguageConfig> = {
    zh_CN: {
        zh_CN: "中文",
        en_US: "English",
        ja_JP: "日本語",
        ok: "确定",
        cancel: "取消",
        defaultText1: "我的世界",
        defaultText2: "中国版",
        resetCamera: "重置相机",
        screenshot: "截图",
        cameraSettings: "场景&相机 设置",
        font: "字体",
        perspective: "透视角度 ({angle}°)",
        textPanelTitle: "文字{index}",
        addText: "添加新文字",
        deleteText: "删除文字",
        front: "正面",
        back: "背面",
        left: "左侧",
        right: "右侧",
        up: "上面",
        down: "下面",
        outline: "描边",
        mode: "模式",
        color: "颜色",
        gradient: "渐变",
        image: "图片",
        selectColor: "选择{side}的颜色",
        selectColorStart: "选择{side}的起始颜色",
        selectColorEnd: "选择{side}的结束颜色",
        repeat: "重复次数",
        offset: "偏移量",
        upload: "上传",
        repeatX: "X轴单位重复（缩放）",
        repeatY: "Y轴单位重复（缩放）",
        offsetX: "X轴偏移",
        offsetY: "Y轴偏移",
        presuppose: "预设",
        customize: "自定义",
        outlineSize: "描边大小",
        thickness: "文字厚度",
        spacing: "文字间距",
        spacingWidth: "空格宽度",
        fontSize: "字体大小",
        upDownRotate: "上下旋转",
        upDownPosition: "上下位置",
        frontBackPosition: "前后位置",
        content: "文本内容",
        texture: "纹理",
        fontSuccess: "字体加载完成!",
        fontLoading: "字体加载中...",
        output: {
            glb: "导出 GLB 模型（包含纹理）",
            gltf: "导出 GLTF 模型",
            obj: "导出 OBJ 模型（不包含纹理）",
            stl: "导出 STL 模型（不包含纹理）"
        },
        lastSaved: {
            message: "是否恢复到上次的场景？({count}行文字)",
            apply: "恢复",
            delete: "删除"
        },
        customFont: {
            namePlaceHolder: "自定义字体",
            upload: "上传字体",
            nameInput: "请输入字体名称（用于显示在字体列表里的名称）",
            success: "字体添加成功",
            failed: "字体添加失败（详细原因请看控制台）",
        },
        fontLicence: {
            netease: "限制商用",
            neteaseTooltip: "商用限制（由于网易已购买商用授权并用于《我的世界》游戏，您可在网易《我的世界》游戏的内部使用）<br>个人用途请遵循<a href=\"https://www.hanyi.com.cn/faq-doc-1\" target=\"_blank\">《汉仪字库个人非商用须知》</a><br>商用请购买商用授权 <a href=\"https://www.hanyi.com.cn/license\" target=\"_blank\">https://www.hanyi.com.cn/license</a>",
            sil: "开放许可证",
            minecraftTenTooltip: "Minecraft Ten Font © 2024, Fardilizer<br>该字体依据 <a href=\"https://fontstruct.com/fontstructions/license/2552125/minecraft-ten-5\" target=\"_blank\"> SIL 开放字体许可证（SIL Open Font License，版本 1.1）</a> 授权使用。",
            fusionPixelTooltip: "Fusion Pixel © 2022, TakWolf<br>该字体依据 <a href=\"https://github.com/TakWolf/fusion-pixel-font/blob/master/LICENSE-OFL\" target=\"_blank\"> SIL 开放字体许可证（SIL Open Font License，版本 1.1）</a> 授权使用。",
            smileyTooltip: "Copyright (c) 2022--2024, atelierAnchor <https://atelier-anchor.com><br>该字体依据 <a href=\"https://github.com/atelier-anchor/smiley-sans/blob/main/LICENSE\" target=\"_blank\"> SIL 开放字体许可证（SIL Open Font License，版本 1.1）</a> 授权使用。"
        }
    },
    en_US: {
        zh_CN: "中文",
        en_US: "English",
        ja_JP: "日本語",
        ok: "OK",
        cancel: "Cancel",
        defaultText1: "MineCraft",
        defaultText2: "Bedrock Edition",
        resetCamera: "Reset Camera",
        screenshot: "Screenshot",
        cameraSettings: "Scene & Camera Settings",
        font: "Font",
        perspective: "Perspective ({angle}°)",
        textPanelTitle: "Text Line {index}",
        addText: "Add Line",
        deleteText: "Delete Line",
        front: "Front",
        back: "Back",
        left: "Left",
        right: "Right",
        up: "Up",
        down: "Down",
        outline: "Outline",
        mode: "Mode",
        color: "Color",
        gradient: "Gradient",
        image: "Image",
        selectColor: "Select Color: {side} Side",
        selectColorStart: "Select Start Color: {side} Side",
        selectColorEnd: "Select End Color: {side} Side",
        repeat: "Repeat",
        offset: "Offset",
        upload: "Upload",
        repeatX: "Repeat X (Scale)",
        repeatY: "Repeat Y (Scale)",
        offsetX: "Offset X",
        offsetY: "Offset Y",
        presuppose: "Presuppose",
        customize: "Customize",
        outlineSize: "Outline Size",
        thickness: "Thickness",
        spacing: "Letter Spacing",
        spacingWidth: "Spacing Width",
        fontSize: "Font Size",
        upDownRotate: "Rotate",
        upDownPosition: "Position(Y)",
        frontBackPosition: "Position(Z)",
        content: "Content",
        texture: "Texture",
        fontSuccess: "Font loaded successfully!",
        fontLoading: "Loading font...",
        output: {
            glb: "Export GLB Model",
            gltf: "Export GLTF Model",
            obj: "Export OBJ Model",
            stl: "Export STL Model"
        },
        lastSaved: {
            message: "Restore to the last scene? ({count} texts)",
            apply: "Apply",
            delete: "Delete"
        },
        customFont: {
            namePlaceHolder: "Custom Font",
            upload: "Upload",
            nameInput: "Please input the font name",
            success: "Font added successfully",
            failed: "Font adding failed (please check the console for more details)",
        },
        fontLicence: {
            netease: "Limitation",
            neteaseTooltip: "Commercial use is restricted, only for internal use of NetEase games",
            sil: "SIL",
            minecraftTenTooltip: "Minecraft Ten Font © 2024, Fardilizer<br>This font is licensed under the SIL Open Font License, Version 1.1. Full license text available at <a href=\"https://fontstruct.com/fontstructions/license/2552125/minecraft-ten-5\" target=\"_blank\">https://fontstruct.com/fontstructions/license/2552125/minecraft-ten-5</a>",
            fusionPixelTooltip: "Fusion Pixel © 2022, TakWolf<br>This font is licensed under the SIL Open Font License, Version 1.1. Full license text available at <a href=\"https://github.com/TakWolf/fusion-pixel-font/blob/master/LICENSE-OFL\" target=\"_blank\">https://github.com/TakWolf/fusion-pixel-font/blob/master/LICENSE-OFL</a>",
            smileyTooltip: "Smiley Sans © 2022--2024, atelierAnchor <https://atelier-anchor.com><br>This font is licensed under the SIL Open Font License, Version 1.1. Full license text available at <a href=\"https://github.com/atelier-anchor/smiley-sans/blob/main/LICENSE\" target=\"_blank\">https://github.com/atelier-anchor/smiley-sans/blob/main/LICENSE</a>"
        }
    },
    ja_JP: {
        zh_CN: "中文",
        en_US: "English",
        ja_JP: "日本語",
        ok: "OK",
        cancel: "キャンセル",
        defaultText1: "マインクラフト",
        defaultText2: "ベッドロック エディション",
        resetCamera: "カメラリセット",
        screenshot: "スクリーンショット",
        cameraSettings: "シーン & カメラ設定",
        font: "フォント",
        perspective: "視野角 ({angle}°)",
        textPanelTitle: "テキスト{index}",
        addText: "テキストを追加",
        deleteText: "テキストを削除",
        front: "前",
        back: "後ろ",
        left: "左",
        right: "右",
        up: "上",
        down: "下",
        outline: "輪郭線",
        mode: "モード",
        color: "カラー",
        gradient: "グラデーション",
        image: "画像",
        selectColor: "{side}面の色を選択",
        selectColorStart: "{side}面の開始色を選択",
        selectColorEnd: "{side}面の終了色を選択",
        repeat: "繰り返し",
        offset: "オフセット",
        upload: "アップロード",
        repeatX: "X軸の繰り返し",
        repeatY: "Y軸の繰り返し",
        offsetX: "X軸オフセット",
        offsetY: "Y軸オフセット",
        presuppose: "プリセット",
        customize: "カスタマイズ",
        outlineSize: "輪郭線の太さ",
        thickness: "文字の厚み",
        spacing: "文字間隔",
        spacingWidth: "スペース幅",
        fontSize: "フォントサイズ",
        upDownRotate: "上下回転",
        upDownPosition: "上下位置",
        frontBackPosition: "前後位置",
        content: "テキスト",
        texture: "テクスチャ",
        fontSuccess: "フォントが読み込まれました！",
        fontLoading: "フォントを読み込み中...",
        output: {
            glb: "GLBモデルをエクスポート",
            gltf: "GLTFモデルをエクスポート",
            obj: "OBJモデルをエクスポート",
            stl: "STLモデルをエクスポート"
        },
        lastSaved: {
            message: "前回のシーンに戻りますか？（{count}行）",
            apply: "適用",
            delete: "削除"
        },
        customFont: {
            namePlaceHolder: "カスタムフォント",
            upload: "アップロード",
            nameInput: "フォント名を入力してください",
            success: "フォントが追加されました",
            failed: "フォントの追加に失敗しました（詳細はコンソールを確認してください）"
        },
        fontLicence: {
            netease: "制限",
            neteaseTooltip: "商用利用は制限されており、NetEaseゲームの内部利用のみです",
            sil: "SIL",
            minecraftTenTooltip: "Minecraft Ten Font © 2024, Fardilizer<br>このフォントは SIL Open Font License、バージョン 1.1 でライセンスされています。完全なライセンステキストは<a href=\"https://fontstruct.com/fontstructions/license/2552125/minecraft-ten-5\" target=\"_blank\">こちら</a>でご覧いただけます。",
            fusionPixelTooltip: "Fusion Pixel © 2022, TakWolf<br>このフォントは SIL Open Font License、バージョン 1.1 でライセンスされています。完全なライセンステキストは<a href=\"https://github.com/TakWolf/fusion-pixel-font/blob/master/LICENSE-OFL\" target=\"_blank\">こちら</a>でご覧いただけます。",
            smileyTooltip: "Smiley Sans © 2022--2024, atelierAnchor <https://atelier-anchor.com><br>このフォントは SIL Open Font License、バージョン 1.1 でライセンスされています。完全なライセンステキストは<a href=\"https://github.com/atelier-anchor/smiley-sans/blob/main/LICENSE\" target=\"_blank\">こちら</a>でご覧いただけます。"
        }
    },
};

// Create context with a default value
const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

const readNavigatorLanguage = () => {
    const b = navigator.language;
    let browserLanguage;
    if (b.startsWith("zh")) {
        browserLanguage = "zh_CN";
    } else if (b.startsWith("ja")) {
        browserLanguage = "ja_JP";
    } else {
        browserLanguage = "en_US";
    }
    return browserLanguage;
}

// 映射语言代码为符合 BCP 47 标准的值
const bcp47LangMap: Record<string, string> = {
    zh_CN: "zh-CN",
    en_US: "en-US",
    ja_JP: "ja-JP",
};

// Provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const browserLanguage = readNavigatorLanguage();
    const initialLanguage = localStorage.getItem("language") || browserLanguage;
    const [language, setLanguage] = useState<string>(initialLanguage);

    useEffect(() => {
        localStorage.setItem("language", language);
        // 动态更新 HTML 的 lang 属性（确保符合标准并兼容浏览器）
        document.documentElement.lang = bcp47LangMap[language] || "en-US";
    }, [language]);

    const gLang = (path: string, params?: LanguageParams): string => {
        const getTranslation = (lang: string): string | undefined => {
            const keys = `${lang}.${path}`.split(".");
            let result: string | LanguageConfig = languageConfig;
            for (const key of keys) {
                if (result && typeof result === "object" && key in result) {
                    result = result[key];
                } else {
                    return undefined;
                }
            }
            return typeof result === "string" ? result : undefined;
        };

        const translation = getTranslation(language) || getTranslation("zh_CN") || path;

        if (params && typeof translation === "string") {
            return Object.entries(params).reduce(
                (result, [key, value]) => result.replace(new RegExp(`{${key}}`, "g"), String(value)),
                translation
            );
        }
        return translation;
    };

    const value = {
        language,
        setLanguage,
        gLang
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

// Custom hook to use the language context
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};