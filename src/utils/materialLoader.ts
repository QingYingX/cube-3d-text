import { TextMaterials } from '../types/text';
import { deserializeMaterial, SerializedMaterial } from './materialSerializer';

// 材质加载状态
export interface MaterialLoaderState {
  isLoading: boolean;
  collections: string[];
  loadedMaterials: Map<string, TextMaterials>;
  error?: string;
}

/**
 * 材质加载器 - 用于从JSON文件加载材质
 */
export class MaterialLoader {
  private state: MaterialLoaderState = {
    isLoading: false,
    collections: [],
    loadedMaterials: new Map()
  };
  
  private baseUrl: string;
  
  // 追踪加载请求的状态
  private indexLoadPromise: Promise<string[]> | null = null;
  private materialLoadPromises: Map<string, Promise<TextMaterials>> = new Map();
  
  constructor(baseUrl: string = '/materials') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * 获取当前状态
   */
  getState(): MaterialLoaderState {
    return this.state;
  }
  
  /**
   * 加载材质索引
   * 现在使用单一请求策略，避免重复请求
   */
  async loadIndex(): Promise<string[]> {
    // 如果已经有数据且没有活跃请求，直接返回
    if (this.state.collections.length > 0 && !this.indexLoadPromise) {
      return this.state.collections;
    }
    
    // 如果已经有请求在进行中，就使用该请求
    if (this.indexLoadPromise) {
      return this.indexLoadPromise;
    }
    
    try {
      this.state.isLoading = true;
      
      // 创建新请求并保存引用
      this.indexLoadPromise = fetch(`${this.baseUrl}/index.json`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`无法加载材质索引: ${response.statusText}`);
          }
          return response.json();
        })
        .then((collections: string[]) => {
          this.state.collections = collections;
          return collections;
        })
        .finally(() => {
          // 请求完成后清除引用
          this.indexLoadPromise = null;
          this.state.isLoading = false;
        });
        
      return this.indexLoadPromise;
    } catch (error) {
      this.state.error = `加载材质索引失败: ${(error as Error).message}`;
      this.indexLoadPromise = null;
      this.state.isLoading = false;
      throw error;
    }
  }
  
  /**
   * 加载指定ID的材质
   * @param id 材质ID
   */
  async loadMaterial(id: string): Promise<TextMaterials> {
    // 检查是否已加载
    if (this.state.loadedMaterials.has(id)) {
      return this.state.loadedMaterials.get(id)!;
    }
    
    // 检查是否已经有请求在进行中
    if (this.materialLoadPromises.has(id)) {
      return this.materialLoadPromises.get(id)!;
    }
    
    try {
      this.state.isLoading = true;
      
      // 创建新请求并保存引用
      const loadPromise = fetch(`${this.baseUrl}/${id}.json`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`无法加载材质: ${response.statusText}`);
          }
          return response.json();
        })
        .then((serializedData: SerializedMaterial) => {
          const material = deserializeMaterial(serializedData);
          // 缓存已加载的材质
          this.state.loadedMaterials.set(id, material);
          return material;
        })
        .finally(() => {
          // 请求完成后移除引用
          this.materialLoadPromises.delete(id);
          if (this.materialLoadPromises.size === 0) {
            this.state.isLoading = false;
          }
        });
      
      // 存储进行中的请求
      this.materialLoadPromises.set(id, loadPromise);
      
      return loadPromise;
    } catch (error) {
      this.state.error = `加载材质失败: ${(error as Error).message}`;
      this.materialLoadPromises.delete(id);
      this.state.isLoading = false;
      throw error;
    }
  }
  
  /**
   * 加载所有材质
   */
  async loadAllMaterials(): Promise<Map<string, TextMaterials>> {
    try {
      // 确保已加载索引，但避免重复加载
      let collections = this.state.collections;
      if (collections.length === 0) {
        collections = await this.loadIndex();
      }
      
      // 避免重复加载已经加载的材质
      const unloadedCollections = collections.filter(id => !this.state.loadedMaterials.has(id));
      
      if (unloadedCollections.length === 0) {
        return this.state.loadedMaterials;
      }
      
      // 加载未加载的材质
      const loadPromises = unloadedCollections.map(collection => 
        this.loadMaterial(collection)
      );
      
      await Promise.all(loadPromises);
      return this.state.loadedMaterials;
    } catch (error) {
      this.state.error = `加载所有材质失败: ${(error as Error).message}`;
      throw error;
    }
  }
  
  /**
   * 清除加载的材质
   */
  clearCache(): void {
    this.state.loadedMaterials.clear();
    this.materialLoadPromises.clear();
    this.indexLoadPromise = null;
  }
}

// 创建默认的材质加载器实例
export const materialLoader = new MaterialLoader();

/**
 * 检查是否所有预设材质已导出到JSON
 * 如果没有，提供一个简单的方法来触发导出
 */
export async function ensurePresetMaterialsExported(): Promise<boolean> {
  try {
    // 如果已有材质索引，直接返回true
    if (materialLoader.getState().collections.length > 0) {
      return true;
    }
    // 尝试加载材质索引，如果成功则认为材质已导出
    await materialLoader.loadIndex();
    return true;
  } catch (error) {
    console.warn('预设材质可能尚未导出到JSON:', error);
    return false;
  }
}