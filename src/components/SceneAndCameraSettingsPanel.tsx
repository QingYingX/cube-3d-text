import { FC, useRef, useState } from "react";
import { Collapse, Form, Input, Select, Slider, Modal, Button, Flex } from "antd";
import { CameraOptions } from "../types/text";
import { useLanguage } from "../language.tsx";
import { convertTTFtoFaceTypeJson as convertToFaceTypeJson, ConvertResult } from "../utils/ttfConverter.ts";
import customFontsStore from "../utils/localForageInstance.ts";
import { useMessage } from "../contexts/MessageContext.tsx";
import {
    DeleteOutlined,
} from "@ant-design/icons";
import { builtinFontsMap } from "../utils/fonts.ts";

// 让父组件传进来的一些状态和方法通过 props 传给此组件
interface CameraSettingsPanelProps {
    // 字体选项
    selectedFont: string;
    setSelectedFont: (val: string) => void;
    fontsMap: Record<string, string>;
    setFontsMap: (val: Record<string, string>) => void;
    customFonts: Record<string, string>;
    setCustomFonts:  React.Dispatch<React.SetStateAction<{ [p: string]: string }>>;
    // 相机/场景视角
    cameraOptions: CameraOptions;
    setCameraOptions: (opts: CameraOptions) => void;
}

const { Panel } = Collapse;

/**
 * 将“相机设置”与“字体选择”部分抽离出来的组件
 */
const SceneAndCameraSettingsPanel: FC<CameraSettingsPanelProps> = ({
                                                               selectedFont,
                                                               setSelectedFont,
                                                               fontsMap,
                                                               setCustomFonts,
                                                               cameraOptions,
                                                               setCameraOptions,
                                                           }) => {
    const { gLang } = useLanguage();

    // 处理 TTF 文件上传
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFontName, setNewFontName] = useState("");
    const [fontData, setFontData] = useState("");

    const messageApi = useMessage();

    const handleClickUploadTTF = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const handleFontFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;
        const file = event.target.files[0];
        try {
            const data: ConvertResult = await convertTTFtoFaceType(file);
            setFontData(data.data);
            setNewFontName(data.names.fullName.en ?? "");
            setIsModalOpen(true);
        } catch (error) {
            console.error("Font load failed:", error);
            messageApi?.error(gLang('customFont.failed'));
        }
    };

    const convertTTFtoFaceType = (file: File): Promise<ConvertResult> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const arrayBuffer = e.target?.result;
                if (!(arrayBuffer instanceof ArrayBuffer)) {
                    reject(new Error("FileReader result is not an ArrayBuffer"));
                    return;
                }
                // 使用 facetype 进行转换
                convertToFaceTypeJson(arrayBuffer).then(rs => resolve(rs));
            };
            reader.readAsArrayBuffer(file);
        });
    };

    // 删除一个自定义字体
    const handleDeleteFont = (fontKey: string) => {
        // 如果是内置字体，忽略
        if (builtinFontsMap[fontKey]) return;
        if (selectedFont === fontKey) {
            setSelectedFont(Object.keys(builtinFontsMap)[0]);  // 切换到第一个内置字体
        }
        setCustomFonts((prev) => {
            const newFonts = { ...prev };
            delete newFonts[fontKey];
            return newFonts;
        });
    };

    const fontOptions = Object.keys(fontsMap).map((fontName) => ({
        label: (
            <Flex justify={'space-between'} align={'center'}>
                <span>{fontName}</span>
                {!builtinFontsMap[fontName] && (
                    <Button
                        size="small"
                        type="text"
                        icon={<DeleteOutlined style={{ opacity: 0.5 }} />}
                        onClick={(e) => {
                            e.stopPropagation(); // 防止触发 Select 下拉收起
                            handleDeleteFont(fontName);
                        }}
                    >
                    </Button>
                )}
            </Flex>
        ),
        value: fontName,
    }));

    return (
        <>
            <Modal
                title={gLang("customFont.namePlaceHolder")}
                open={isModalOpen}
                okText={gLang("ok")}
                cancelText={gLang("cancel")}
                onOk={async () => {
                    if (!newFontName.trim()) {
                        return messageApi?.warning(gLang("customFont.nameEmpty"));
                    }
                    const fontKey = `font-${newFontName.trim()}`;
                    await customFontsStore.setItem(fontKey, fontData);
                    setCustomFonts((prev) => ({
                        ...prev,
                        [newFontName.trim()]: 'custom:' + fontKey,
                    }));
                    setNewFontName("");
                    setFontData("");
                    setIsModalOpen(false);
                    messageApi?.success(gLang('customFont.success'));
                }}
                onCancel={() => {
                    setNewFontName("");
                    setFontData("");
                    setIsModalOpen(false);
                }}
            >
                <p>{gLang('customFont.nameInput')}</p>
                <Input
                    value={newFontName}
                    onChange={(e) => setNewFontName(e.target.value)}
                    placeholder={gLang("customFont.namePlaceHolder")}
                />
            </Modal>
            <Collapse
                defaultActiveKey={["camera"]}
                bordered={false}
                style={{ background: "white", boxShadow: "0 2px 16px rgba(0, 0, 0, 0.05)" }}
            >
                <Panel header={gLang("cameraSettings")} key="camera">
                    {/* 1. 字体选择 */}
                    <Form.Item label={gLang("font")}>
                        <Select
                            style={{ width: "100%" }}
                            value={selectedFont}
                            onChange={(value) => setSelectedFont(value)}
                            dropdownRender={(menu) => (
                                <>
                                    {menu}
                                    <Button size="small" type="dashed" block onClick={handleClickUploadTTF} style={{ marginTop: 8 }}>
                                        {gLang("customFont.upload")}
                                    </Button>
                                </>
                            )}
                            options={fontOptions}
                        />
                        {/* 隐藏的 file input 用于接收 TTF */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".ttf"
                            style={{ display: "none" }}
                            onChange={handleFontFileChange}
                        />
                    </Form.Item>

                    {/* 2. 相机 FOV (perspective) 设置 */}
                    <Form.Item label={gLang("perspective", { angle: cameraOptions.fov })} style={{ marginBottom: 0 }}>
                        <Slider
                            min={1}
                            max={120}
                            step={1}
                            value={cameraOptions.fov}
                            onChange={(val) => setCameraOptions({ ...cameraOptions, fov: val })}
                        />
                    </Form.Item>
                </Panel>
            </Collapse>
        </>
    );
};

export default SceneAndCameraSettingsPanel;