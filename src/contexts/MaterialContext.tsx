import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TextMaterials } from '../types/text';
import { materialLoader } from '../utils/materialLoader';

// 创建材质上下文的类型
interface MaterialContextType {
  isLoading: boolean;
  error: string | null;
  collections: string[];
  loadedMaterials: Map<string, TextMaterials>;
  loadMaterials: () => Promise<void>;
  clearMaterialCache: () => void;
}

// 创建默认值
const defaultContextValue: MaterialContextType = {
  isLoading: false,
  error: null,
  collections: [],
  loadedMaterials: new Map(),
  loadMaterials: async () => {},
  clearMaterialCache: () => {}
};

// 创建上下文
const MaterialContext = createContext<MaterialContextType>(defaultContextValue);

// 创建上下文提供者组件
export const MaterialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{
    isLoading: boolean;
    error: string | null;
    collections: string[];
    loadedMaterials: Map<string, TextMaterials>;
  }>({
    isLoading: false,
    error: null,
    collections: [],
    loadedMaterials: new Map()
  });

  // 加载所有材质
  const loadMaterials = async () => {
    // 如果已经加载了材质并且没有错误，就不再重新加载
    if (state.collections.length > 0 && state.loadedMaterials.size > 0 && !state.error) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // 加载材质索引
      const loadedCollections = await materialLoader.loadIndex();
      
      // 加载所有材质
      const materials = await materialLoader.loadAllMaterials();
      
      setState({
        isLoading: false,
        error: null,
        collections: loadedCollections,
        loadedMaterials: materials
      });
    } catch (err) {
      console.error("无法加载JSON材质:", err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "无法加载材质文件"
      }));
    }
  };

  // 清除材质缓存
  const clearMaterialCache = () => {
    materialLoader.clearCache();
    setState({
      isLoading: false,
      error: null,
      collections: [],
      loadedMaterials: new Map()
    });
  };

  // 组件首次加载时尝试加载材质
  useEffect(() => {
    loadMaterials();
  }, []);

  const value: MaterialContextType = {
    ...state,
    loadMaterials,
    clearMaterialCache
  };

  return (
    <MaterialContext.Provider value={value}>
      {children}
    </MaterialContext.Provider>
  );
};

// 创建自定义钩子，用于在组件中访问材质上下文
export const useMaterials = () => useContext(MaterialContext);

export default MaterialContext;