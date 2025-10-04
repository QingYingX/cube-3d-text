import { FC, useRef } from "react";
import { Form, Slider } from "antd";
import { CameraOptions } from "../types/text";
import { useLanguage } from "../language.tsx";
import { useFonts } from "../contexts/FontContext";
import { builtinFontsLicence, builtinFontsMap } from "../utils/fonts.ts";
import FontSelector from "./FontSelector";

// 让父组件传进来的一些状态和方法通过 props 传给此组件
interface CameraSettingsPanelProps {
    // 字体选项
    selectedFont: string;
    setSelectedFont: (val: string) => void;
    // 相机/场景视角
    cameraOptions: CameraOptions;
    setCameraOptions: (opts: CameraOptions) => void;
}

/**
 * 将"相机设置"与"字体选择"部分抽离出来的组件
 */
const SceneAndCameraSettingsPanel: FC<CameraSettingsPanelProps> = ({
    selectedFont,
    setSelectedFont,
    cameraOptions,
    setCameraOptions,
}) => {
    const { gLang } = useLanguage();
    const { fontsMap, uploadFont, deleteFont } = useFonts();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleClickUploadTTF = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const handleFontFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        
        const newFontName = await uploadFont(file);
        if (newFontName) {
            setSelectedFont(newFontName); // 上传成功后切换到新字体
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept=".ttf"
                style={{ display: "none" }}
                onChange={handleFontFileChange}
            />
            
            {/* 1. 字体选择 */}
            <Form.Item label={gLang("font")}>
                <FontSelector
                    value={selectedFont}
                    onChange={setSelectedFont}
                    fontsMap={fontsMap}
                    builtinFontsMap={builtinFontsMap}
                    builtinFontsLicence={builtinFontsLicence}
                    onUploadClick={handleClickUploadTTF}
                    onDeleteFont={deleteFont}
                />
            </Form.Item>

            {/* 2. 相机 FOV (perspective) 设置 */}
            <Form.Item
                label={
                    cameraOptions.fov === 0
                        ? gLang("orthographicProjection")
                        : gLang("perspectiveAngle", { angle: cameraOptions.fov })
                }
                style={{ marginBottom: 0 }}
            >
                <Slider
                    min={0}
                    max={120}
                    step={1}
                    value={cameraOptions.fov}
                    onChange={(val) => {
                        const newCameraType = val === 0 ? 'orthographic' : 'perspective';
                        setCameraOptions({
                            ...cameraOptions,
                            fov: val,
                            cameraType: newCameraType,
                            zoom: cameraOptions.zoom || 1
                        });
                    }}
                />
            </Form.Item>
        </>
    );
};

export default SceneAndCameraSettingsPanel;