import React, { useState } from "react";
import { Form, Select, Slider, Collapse, Space, Upload, Button, Flex } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import ColorPickerPopover from "./ColorPickerPopover";
import {
    TextMaterials,
    TextMaterialOption,
    TextMaterialGradientOption,
    TextMaterialImageOption,
    TextMaterialColorOption,
} from "../types/text";
import { useLanguage } from "../language";

const { Panel } = Collapse;
const { Option } = Select;

interface TextSettingsMaterialPanelProps {
    materials: TextMaterials;
    onMaterialsChange: (materials: TextMaterials) => void;
}

const TextSettingsMaterialPanel: React.FC<TextSettingsMaterialPanelProps> = ({
                                                                                 materials,
                                                                                 onMaterialsChange,
                                                                             }) => {
    // 保存每种模式的配置
    const [materialConfigs, setMaterialConfigs] = useState<{
        [key in keyof TextMaterials]: {
            gradient?: TextMaterialGradientOption;
            image?: TextMaterialImageOption;
            color?: TextMaterialColorOption;
        };
    }>({
        front: {},
        back: {},
        up: {},
        down: {},
        left: {},
        right: {},
        outline: {},
    });

    const { gLang } = useLanguage();

    const faceLabels: { [key in keyof TextMaterials]: string } = {
        front: gLang("front"),
        back: gLang("back"),
        up: gLang("up"),
        down: gLang("down"),
        left: gLang("left"),
        right: gLang("right"),
        outline: gLang("outline"),
    };

    const handleModeChange = (face: keyof TextMaterials, mode: TextMaterialOption["mode"]) => {
        const currentMaterial = materials[face];

        // 保存当前模式的配置
        setMaterialConfigs((prevConfigs) => ({
            ...prevConfigs,
            [face]: {
                ...prevConfigs[face],
                [currentMaterial.mode]: currentMaterial,
            },
        }));

        // 切换到新模式时，尝试恢复之前的配置
        let newMaterialOption: TextMaterialOption;
        if (materialConfigs[face] && materialConfigs[face][mode]) {
            newMaterialOption = materialConfigs[face][mode]!;
        } else {
            switch (mode) {
                case "gradient":
                    newMaterialOption = {
                        mode: "gradient",
                        colorGradualStart: "#ffffff",
                        colorGradualEnd: "#000000",
                        repeat: 1,
                        offset: 0,
                    } as TextMaterialGradientOption;
                    break;
                case "image":
                    newMaterialOption = {
                        mode: "image",
                        image: "",
                        repeatX: 0.1,
                        repeatY: 0.1,
                        offsetX: 0,
                        offsetY: 0,
                    } as TextMaterialImageOption;
                    break;
                case "color":
                default:
                    newMaterialOption = {
                        mode: "color",
                        color: "#ffffff",
                    } as TextMaterialColorOption;
                    break;
            }
        }

        const updatedMaterials = {
            ...materials,
            [face]: newMaterialOption,
        };
        onMaterialsChange(updatedMaterials);
    };

    const handleOptionChange = (
        face: keyof TextMaterials,
        option: Partial<TextMaterialOption>
    ) => {
        const currentMaterial = materials[face];
        const updatedMaterial = { ...currentMaterial, ...option } as TextMaterialOption;
        const updatedMaterials = {
            ...materials,
            [face]: updatedMaterial,
        };
        onMaterialsChange(updatedMaterials);
    };

    const renderModeOptions = (face: keyof TextMaterials) => {
        const currentMaterial = materials[face];
        return (
            <>
                <Form.Item label={gLang('mode')} key={`${face}-mode`}>
                    <Select
                        value={currentMaterial.mode}
                        onChange={(value) => handleModeChange(face, value)}
                        style={{ width: 150 }}
                    >
                        <Option value="color">{gLang('color')}</Option>
                        <Option value="gradient">{gLang('gradient')}</Option>
                        <Option value="image">{gLang('image')}</Option>
                    </Select>
                </Form.Item>

                {currentMaterial.mode === "color" && (
                    <Form.Item label={gLang('color')} key={`${face}-color`}>
                        <ColorPickerPopover
                            color={(currentMaterial as TextMaterialColorOption).color}
                            onChange={(color) =>
                                handleOptionChange(face, { color } as TextMaterialColorOption)
                            }
                            label={gLang('selectColor', { side: faceLabels[face] })}
                        />
                    </Form.Item>
                )}

                {currentMaterial.mode === "gradient" && (
                    <>
                        <Form.Item label={gLang('color')} key={`${face}-gradient-start`}>
                            <Space>
                                <ColorPickerPopover
                                    color={(currentMaterial as TextMaterialGradientOption).colorGradualStart}
                                    onChange={(color) =>
                                        handleOptionChange(face, { colorGradualStart: color })
                                    }
                                    label={gLang('selectColorStart', { side: faceLabels[face] })}
                                />
                                <ColorPickerPopover
                                    color={(currentMaterial as TextMaterialGradientOption).colorGradualEnd}
                                    onChange={(color) =>
                                        handleOptionChange(face, { colorGradualEnd: color })
                                    }
                                    label={gLang('selectColorEnd', { side: faceLabels[face] })}
                                />
                            </Space>
                        </Form.Item>
                        <Form.Item label={gLang('repeat')} key={`${face}-gradient-repeat`}>
                            <Slider
                                min={0.1}
                                max={10}
                                step={0.1}
                                value={(currentMaterial as TextMaterialGradientOption).repeat}
                                onChange={(value) =>
                                    handleOptionChange(face, { repeat: value })
                                }
                            />
                        </Form.Item>
                        <Form.Item label={gLang('offset')} key={`${face}-gradient-offset`}>
                            <Slider
                                min={0}
                                max={10}
                                step={0.1}
                                value={(currentMaterial as TextMaterialGradientOption).offset}
                                onChange={(value) =>
                                    handleOptionChange(face, { offset: value })
                                }
                            />
                        </Form.Item>
                    </>
                )}

                {currentMaterial.mode === "image" && (
                    <>
                        <Form.Item label={gLang('image')} key={`${face}-image-upload`}>
                            <Flex vertical gap={'small'}>
                                <Upload
                                    accept="image/*"
                                    showUploadList={false}
                                    beforeUpload={(file) => {
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            handleOptionChange(face, { image: e.target?.result as string });
                                        };
                                        reader.readAsDataURL(file);
                                        return false;
                                    }}
                                    onChange={(info) => {
                                        if (info.file.status === 'done') {
                                            const reader = new FileReader();
                                            reader.onload = (e) => {
                                                handleOptionChange(face, { image: e.target?.result as string });
                                            };
                                            if (info.file.originFileObj instanceof Blob) {
                                                reader.readAsDataURL(info.file.originFileObj);
                                            }
                                        }
                                    }}
                                >
                                    <Button icon={<UploadOutlined />}>{gLang('upload')}</Button>
                                </Upload>
                                {materials[face].mode === "image" && materials[face].image && (
                                    <img
                                        src={materials[face].image}
                                        alt="preview"
                                        style={{
                                            maxWidth: '100%',
                                            width: 'auto',
                                            height: 'auto',
                                            imageRendering: 'pixelated',
                                        }}
                                    />
                                )}
                            </Flex>
                        </Form.Item>
                        <Form.Item label={gLang('repeatX')} key={`${face}-image-repeat-x`}>
                            <Slider
                                min={0.001}
                                max={2}
                                step={0.001}
                                value={(currentMaterial as TextMaterialImageOption).repeatX}
                                onChange={(value) =>
                                    handleOptionChange(face, { repeatX: value })
                                }
                            />
                        </Form.Item>
                        <Form.Item label={gLang('repeatY')} key={`${face}-image-repeat-y`}>
                            <Slider
                                min={0.001}
                                max={2}
                                step={0.001}
                                value={(currentMaterial as TextMaterialImageOption).repeatY}
                                onChange={(value) =>
                                    handleOptionChange(face, { repeatY: value })
                                }
                            />
                        </Form.Item>
                        <Form.Item label={gLang('offsetX')} key={`${face}-image-offset-x`}>
                            <Slider
                                min={0}
                                max={10}
                                step={0.01}
                                value={(currentMaterial as TextMaterialImageOption).offsetX}
                                onChange={(value) =>
                                    handleOptionChange(face, { offsetX: value })
                                }
                            />
                        </Form.Item>
                        <Form.Item label={gLang('offsetY')} key={`${face}-image-offset-y`}>
                            <Slider
                                min={0}
                                max={10}
                                step={0.01}
                                value={(currentMaterial as TextMaterialImageOption).offsetY}
                                onChange={(value) =>
                                    handleOptionChange(face, { offsetY: value })
                                }
                            />
                        </Form.Item>
                    </>
                )}
            </>
        );
    };

    const renderExtraPreview = (material: TextMaterialOption) => {
        switch (material.mode) {
            case "color": {
                return (
                    <div style={{
                        backgroundColor: (material as TextMaterialColorOption).color,
                        width: 20,
                        height: 20,
                        borderRadius: 3,
                        boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)"
                    }}/>
                );
            }
            case "gradient": {
                const {colorGradualStart, colorGradualEnd} = material as TextMaterialGradientOption;
                return (
                    <div style={{
                        background: `linear-gradient(180deg, ${colorGradualStart}, ${colorGradualEnd})`,
                        width: 20,
                        height: 20,
                        borderRadius: 3,
                        boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)"
                    }} />
                );
            }
            case "image": {
                return (
                    <img
                        src={(material as TextMaterialImageOption).image}
                        alt="preview"
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: 3,
                            boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)"
                        }}
                    />
                );
            }
        }
    };

    return (
        <Collapse accordion>
            {(Object.keys(materials) as Array<keyof TextMaterials>).map((face) => (
                <Panel header={faceLabels[face]} key={face} extra={renderExtraPreview(materials[face])}>
                    <Form layout="vertical">
                        {renderModeOptions(face)}
                    </Form>
                </Panel>
            ))}
        </Collapse>
    );
};

export default TextSettingsMaterialPanel;