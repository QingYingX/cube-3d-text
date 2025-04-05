// src/App.tsx
import React, { useEffect, useRef, useState } from "react";
import {
    Splitter,
    Alert,
    Button,
    Collapse,
    ConfigProvider,
    Dropdown,
    Flex,
    MenuProps,
    Space,
    Typography,
    Tabs,
    Card,
    Popover,
    Modal
} from "antd";
import {
    AppstoreOutlined,
    BookOutlined,
    CameraOutlined,
    CompassOutlined,
    DeleteOutlined,
    GlobalOutlined,
    PlusOutlined,
    ReloadOutlined,
    SettingOutlined,
    GithubOutlined
} from "@ant-design/icons";
import { HappyProvider } from '@ant-design/happy-work-theme';
import ThreeCanvas, { ThreeCanvasHandle } from "./components/ThreeCanvas";
import "antd/dist/reset.css";
import { CameraOptions, Text3DData, WorkspaceData } from "./types/text";
import TextSettingsPanel from "./components/TextSettingsPanel.tsx";
import { materialGradientLightBlue, materialGradientMediumYellow } from "./presetMaterials.ts";
import { MessageProvider } from "./contexts/MessageContext";
import { useLanguage } from "./language.tsx";
import SceneAndCameraSettingsPanel from "./components/SceneAndCameraSettingsPanel.tsx";
import { builtinFontsMap, builtinFontsTextureYOffset } from "./utils/fonts.ts";

const { Panel } = Collapse;

const App: React.FC = () => {
    const { language, setLanguage, gLang } = useLanguage();

    const [selectedFont, setSelectedFont] = useState(language === "en_US" ? "Minecraft Ten" : "Fusion Pixel 10px");
    const [customFonts, setCustomFonts] = useState<{ [fontName: string]: string }>(() => {
        const stored = localStorage.getItem("customFonts");
        return stored ? JSON.parse(stored) : {};
    });
    //   注意：为了刷新能实时看到，你可以把它拆分成 hooks 或在 render 里实时合并
    const [fontsMap, setFontsMap] = useState<{ [name: string]: string }>({
        ...builtinFontsMap,
        ...customFonts,
    });
    useEffect(() => {
        // 当 customFonts 有变动时，合并到 fontsMap 并存储到 localStorage
        setFontsMap({
            ...builtinFontsMap,
            ...customFonts,
        });
        localStorage.setItem("customFonts", JSON.stringify(customFonts));
    }, [customFonts]);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [texts, setTexts] = useState<Text3DData[]>([
        {
            content: gLang('defaultText1'),
            opts: {
                size: 10,
                depth: 5,
                y: 8,
                z: 0,
                rotY: 0,
                materials: materialGradientMediumYellow,
                outlineWidth: 0.4,
                letterSpacing: 1.0,
                spacingWidth: 0.2
            },
            position: [0, 0, 0],
            rotation: [0, 0, 0]
        },
        {
            content: gLang('defaultText2'),
            opts: {
                size: 5,
                depth: 3,
                y: -4,
                z: 0,
                rotY: 0,
                materials: materialGradientLightBlue,
                outlineWidth: 0.5,
                letterSpacing: 1.5,
                spacingWidth: 0.2
            },
            position: [0, 0, 0],
            rotation: [0, 0, 0]
        }
    ]);

    const [cameraOptions, setCameraOptions] = useState<CameraOptions>({
        fov: 75
    });

    const [textPanelActiveKeys, setTextPanelActiveKeys] = useState<string[]>(['1']);

    const [lastWorkshop, setLastWorkshop] = useState<WorkspaceData | null>(null);

    // 创建一个引用来访问 ThreeCanvas 的截图和重置功能
    const threeCanvasRef = useRef<ThreeCanvasHandle>(null);

    const handleScreenshot = () => {
        if (threeCanvasRef.current) {
            threeCanvasRef.current.takeScreenshot();
        }
    };

    const handleOutputOption: MenuProps['onClick'] = (e) => {
        if (threeCanvasRef.current) {
            if (e.key === 'glb' || e.key === 'gltf' || e.key === 'obj' || e.key === 'stl') {
                threeCanvasRef.current.exportScene(e.key);
            }
        }
    };

    const handleResetCamera = () => {
        if (threeCanvasRef.current) {
            threeCanvasRef.current.resetCamera();
        }
    }

    // 自动加载工作区
    useEffect(() => {
        const workspaceStr = localStorage.getItem('workspace');
        if (workspaceStr) {
            const workspace: WorkspaceData = JSON.parse(workspaceStr);
            // 修复一些缺失的数据（兼容旧版数据）
            workspace.texts.forEach((text) => {
                if (!text.opts.z) {
                    text.opts.z = 0;
                }
            });
            setLastWorkshop(workspace);
        }
    }, []);

    const [initTime] = useState<number>(Date.now());

    // 自动保存工作区
    useEffect(() => {
        const now = Date.now();
        // 只有在 5 秒后才会自动保存
        if (now - initTime < 5000) {
            return;
        }
        const workspace: WorkspaceData = {
            fontId: selectedFont,
            texts: texts
        };
        // 保存工作区数据
        localStorage.setItem('workspace', JSON.stringify(workspace));
        setLastWorkshop(null);
    }, [selectedFont, texts, initTime]);

    const handleAddText = () => {
        setTexts([
            ...texts,
            {
                content: 'New Text',
                opts: {
                    size: 5,
                    depth: 3,
                    y: texts.length * -6,
                    z: 0,
                    rotY: 0,
                    materials: materialGradientLightBlue,
                    outlineWidth: 0.5,
                    letterSpacing: 1.5,
                    spacingWidth: 0.2
                },
                position: [0, 0, 0],
                rotation: [0, 0, 0]
            }
        ]);
    }

    // 国内镜像加速站
    const [chinaMirrorAlertModal, setChinaMirrorAlertModal] = useState(false);

    useEffect(() => {
        if (window.location.hostname === '3dtext.easecation.net') {
            const hideChinaMirrorAlertUntil = localStorage.getItem('hideChinaMirrorAlertUntil');
            if (hideChinaMirrorAlertUntil && parseInt(hideChinaMirrorAlertUntil) > Date.now()) {
                return;
            }
            fetch('https://api.ip.sb/geoip')
                .then((res) => res.json())
                .then((data) => {
                    if (data.country_code === 'CN') {
                        setChinaMirrorAlertModal(true);
                    }
                })
                .catch((err) => {
                    console.error('IP 查询失败', err);
                });
        }
    }, []);

    // 手机端交互

    const [tabActiveKey, setTabActiveKey] = useState('1');

    const onTabChange = (key: string) => {
        setTabActiveKey(key);
    };

    const onTabEdit = (e: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
        if (action === 'add') {
            handleAddText();
            setTabActiveKey((texts.length + 1).toString());
        } else {
            if (typeof e === 'string') {
                const index = parseInt(e);
                if (tabActiveKey === e) {
                    setTabActiveKey('1');
                }
                const newTexts = [...texts];
                newTexts.splice(index - 1, 1);
                setTexts(newTexts);
            }
        }
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#333333',
                },
                components: {
                    Button: {
                        primaryShadow: '0 2px 0 rgba(0, 0, 0, 0.08)'
                    },
                    Dropdown: {
                        controlItemBgActive: 'rgba(0, 0, 0, 0.12)',
                        controlItemBgActiveHover: 'rgba(0, 0, 0, 0.2)',
                    },
                    Select: {
                        optionSelectedBg: 'rgba(0, 0, 0, 0.12)',
                    },
                    Form: {
                        itemMarginBottom: 12
                    },
                },
            }}
        >
            <MessageProvider>
                <Modal
                    title="提示"
                    open={chinaMirrorAlertModal}
                    okText="🚀 立即前往"
                    width={400}
                    onOk={() => {
                        window.location.href = 'https://3dt.easecation.net';
                    }}
                    cancelText="7 天内不再显示"
                    onCancel={() => {
                        setChinaMirrorAlertModal(false);
                        localStorage.setItem('hideChinaMirrorAlertUntil', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
                    }}
                >
                    🚀 国内用户推荐访问国内镜像以获得极速体验～
                </Modal>
                {/* 手机端场景和镜头设置*/}
                {isMobile && (
                    <Popover
                        title={gLang('cameraSettings')}
                        overlayStyle={{ width: "90%" }}
                        content={
                            <ConfigProvider
                                theme={{
                                    components: {
                                        Form: {
                                            itemMarginBottom: 0
                                        }
                                    },
                                }}
                            >
                            <SceneAndCameraSettingsPanel
                                selectedFont={selectedFont}
                                setSelectedFont={setSelectedFont}
                                fontsMap={fontsMap}
                                setFontsMap={setFontsMap}
                                customFonts={customFonts}
                                setCustomFonts={setCustomFonts}
                                cameraOptions={cameraOptions}
                                setCameraOptions={setCameraOptions}
                            />
                            </ConfigProvider>
                        }
                        trigger="click"
                        placement="bottomRight"
                    >
                        <Button style={{ position: "absolute", left: 20, top: 20, zIndex: 1 }}>
                            <SettingOutlined />
                        </Button>
                    </Popover>
                )}
                <Splitter layout={isMobile ? 'vertical' : 'horizontal'} style={{ height: '100vh' }}>
                    {/* 左侧配置面板 */}
                    {
                        !isMobile && (
                            <Splitter.Panel defaultSize={300} min={250} max={500} style={{ background: "#F5F5F5", padding: 16, overflow: "auto" }}>
                                <Flex vertical gap={"middle"} style={{ width: "100%" }}>
                                    <Collapse
                                        defaultActiveKey={["camera"]}
                                        bordered={false}
                                        style={{ background: "white", boxShadow: "0 2px 16px rgba(0, 0, 0, 0.05)" }}
                                    >
                                        <Panel header={gLang("cameraSettings")} key="camera">
                                            <SceneAndCameraSettingsPanel
                                                selectedFont={selectedFont}
                                                setSelectedFont={setSelectedFont}
                                                fontsMap={fontsMap}
                                                setFontsMap={setFontsMap}
                                                customFonts={customFonts}
                                                setCustomFonts={setCustomFonts}
                                                cameraOptions={cameraOptions}
                                                setCameraOptions={setCameraOptions}
                                            />
                                        </Panel>
                                    </Collapse>
                                    {texts.length > 0 &&
                                        <Collapse activeKey={textPanelActiveKeys} onChange={setTextPanelActiveKeys} bordered={false} style={{ background: "white", boxShadow: "0 2px 16px rgba(0, 0, 0, 0.05)" }}>
                                            {texts.map((text, index) => (
                                                <Panel
                                                    header={text.content ? text.content : gLang(`textPanelTitle`, { index: index + 1 })}
                                                    key={index + 1}
                                                    extra={
                                                        <Flex style={{ height: 22, width: 22, marginTop: -2 }}>
                                                            <Button
                                                                type={"text"}
                                                                size={'small'}
                                                                style={{
                                                                    height: 26,
                                                                    width: 26,
                                                                }}
                                                                onClick={() => {
                                                                    const newTexts = [...texts];
                                                                    newTexts.splice(index, 1);
                                                                    setTexts(newTexts);
                                                                }}
                                                            >
                                                                <DeleteOutlined style={{ opacity: 0.5 }} />
                                                            </Button>
                                                        </Flex>
                                                    }
                                                >
                                                    <TextSettingsPanel
                                                        text={text.content}
                                                        textOptions={text.opts}
                                                        onTextChange={(newText) => {
                                                            const newTexts = [...texts];
                                                            newTexts[index].content = newText;
                                                            setTexts(newTexts);
                                                        }}
                                                        onTextOptionsChange={(newOptions) => {
                                                            const newTexts = [...texts];
                                                            newTexts[index].opts = newOptions;
                                                            setTexts(newTexts);
                                                        }}
                                                    />
                                                </Panel>
                                            ))}
                                        </Collapse>
                                    }
                                    <Button
                                        type="dashed"
                                        icon={<PlusOutlined />}
                                        onClick={() => {
                                            setTexts([
                                                ...texts,
                                                {
                                                    content: 'New Text',
                                                    opts: {
                                                        size: 5,
                                                        depth: 3,
                                                        y: texts.length * -6,
                                                        z: 0,
                                                        rotY: 0,
                                                        materials: materialGradientLightBlue,
                                                        outlineWidth: 0.5,
                                                        letterSpacing: 1.5,
                                                        spacingWidth: 0.2
                                                    },
                                                    position: [0, 0, 0],
                                                    rotation: [0, 0, 0]
                                                }
                                            ]);
                                            setTextPanelActiveKeys([(texts.length + 1).toString()]);
                                        }}
                                    >
                                        {gLang('addText')}
                                    </Button>
                                </Flex>
                            </Splitter.Panel>
                        )
                    }
                    {/* 右侧 3D 场景 */}
                    <Splitter.Panel style={{ position: "relative" }}>
                        <ThreeCanvas
                            ref={threeCanvasRef}
                            cameraOptions={cameraOptions}
                            texts={texts}
                            fontUrl={fontsMap[selectedFont]}
                            globalTextureYOffset={builtinFontsTextureYOffset[selectedFont] ?? 0}
                        />
                        {/* 添加截图按钮 */}
                        <Flex gap={"small"} style={{ position: "absolute", top: 20, right: 20, zIndex: 1 }}>
                            <Button
                                type="default"
                                icon={<ReloadOutlined />}
                                onClick={handleResetCamera}
                            >
                                {gLang('resetCamera')}
                            </Button>
                            <HappyProvider>
                                <Dropdown.Button
                                    type="primary"
                                    menu={{
                                        items: [
                                            {
                                                key: 'glb',
                                                label: gLang('output.glb'),
                                                icon: <AppstoreOutlined />
                                            },
                                            // {
                                            //     key: 'gltf',
                                            //     label: gLang('output.gltf'),
                                            //     icon: <AppstoreOutlined />
                                            // },
                                            {
                                                key: 'obj',
                                                label: gLang('output.obj'),
                                                icon: <BookOutlined />
                                            },
                                            {
                                                key: 'stl',
                                                label: gLang('output.stl'),
                                                icon: <CompassOutlined />
                                            },
                                        ],
                                        onClick: handleOutputOption
                                    }}
                                    onClick={handleScreenshot}
                                >
                                    <CameraOutlined />
                                    {gLang('screenshot')}
                                </Dropdown.Button>
                            </HappyProvider>

                        </Flex>

                        {/* 右下角悬浮 */}
                        <Flex style={{ position: "absolute", bottom: 8, right: 8, zIndex: 1 }}>
                            <a href="https://github.com/EaseCation/cube-3d-text" target="_blank" rel="noopener noreferrer">
                                <Button type={'text'} style={{ padding: "0px 12px" }}>
                                    <Typography.Text type={'secondary'}>
                                        <Space size={'small'}>
                                            <GithubOutlined />
                                            {gLang('githubRepo')}
                                        </Space>
                                    </Typography.Text>
                                </Button>
                            </a>
                            <Dropdown
                                menu={{
                                    items: [
                                        { key: 'zh_CN', label: gLang('zh_CN') },
                                        { key: 'en_US', label: gLang('en_US') },
                                        { key: 'ja_JP', label: gLang('ja_JP') },
                                    ],
                                    selectable: true,
                                    defaultSelectedKeys: [language],
                                    onSelect: ({ key }) => setLanguage(key)
                                }}
                            >
                                <Button type={'text'} style={{ padding: "0px 12px" }}>
                                    <Typography.Text type={'secondary'}>
                                        <Space size={'small'}>
                                            <GlobalOutlined />
                                            {gLang(language)}
                                        </Space>
                                    </Typography.Text>
                                </Button>
                            </Dropdown>
                        </Flex>

                        {/*顶部悬浮*/}
                        <Flex style={{ position: "absolute", top: 16, zIndex: 1, width: "100%", pointerEvents: "none", left: 0 }} justify={'center'}>
                            {lastWorkshop && (
                                <Alert
                                    message={gLang('lastSaved.message', { count: lastWorkshop.texts.length })}
                                    type="info"
                                    showIcon
                                    style={{ pointerEvents: "auto" }}
                                    action={
                                        <Space size={0} style={{ marginLeft: 12 }}>
                                            <Button
                                                size="small"
                                                type="text"
                                                style={{ paddingLeft: 4, paddingRight: 4 }}
                                                onClick={() => {
                                                    setLastWorkshop(null);
                                                    localStorage.removeItem('workspace');
                                                }}
                                            >
                                                {gLang('lastSaved.delete')}
                                            </Button>
                                            <Button
                                                size="small"
                                                type="link"
                                                style={{ paddingLeft: 4, paddingRight: 4 }}
                                                onClick={() => {
                                                    setSelectedFont(lastWorkshop.fontId);
                                                    setTexts(lastWorkshop.texts);
                                                    setLastWorkshop(null);
                                                }}
                                            >
                                                {gLang('lastSaved.apply')}
                                            </Button>
                                        </Space>
                                    }
                                    closable
                                />
                            )}
                        </Flex>
                    </Splitter.Panel>

                    {/* 手机端配置面板 */}
                    {isMobile && (
                        <Splitter.Panel defaultSize={"50%"} min={200}>
                            <Flex vertical style={{ height: "100%", padding: 16 }}>
                                <Tabs
                                    tabBarStyle={{ marginBottom: 0 }}
                                    removeIcon={<DeleteOutlined />}
                                    onChange={onTabChange}
                                    activeKey={tabActiveKey}
                                    type="editable-card"
                                    onEdit={onTabEdit}
                                    items={texts.map((text, index) => {
                                        return {
                                            key: String(index + 1),
                                            label: text.content || gLang('textPanelTitle', { index: index + 1 })
                                        };
                                    })}
                                />
                                {
                                    texts.map((text, index) => (
                                        <Card
                                            style={{
                                                display: tabActiveKey === String(index + 1) ? "block" : "none",
                                                overflow: "auto",
                                                height: "100%",
                                                borderTopLeftRadius: 0
                                            }}
                                            styles={{
                                                body: {
                                                    overflow: "auto",
                                                }
                                            }}
                                        >
                                            <TextSettingsPanel
                                                text={text.content}
                                                textOptions={text.opts}
                                                onTextChange={(newText) => {
                                                    const newTexts = [...texts];
                                                    newTexts[index].content = newText;
                                                    setTexts(newTexts);
                                                }}
                                                onTextOptionsChange={(newOptions) => {
                                                    const newTexts = [...texts];
                                                    newTexts[index].opts = newOptions;
                                                    setTexts(newTexts);
                                                }}
                                            />
                                        </Card>
                                    ))
                                }
                            </Flex>
                        </Splitter.Panel>
                    )}
                </Splitter>
            </MessageProvider>
        </ConfigProvider>
    );
};

export default App;
