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
   */
  async loadIndex(): Promise<string[]> {
    try {
      this.state.isLoading = true;
      
      const response = await fetch(`${this.baseUrl}/index.json`);
      if (!response.ok) {
        throw new Error(`无法加载材质索引: ${response.statusText}`);
      }
      
      const collections = await response.json() as string[];
      this.state.collections = collections;
      
      return collections;
    } catch (error) {
      this.state.error = `加载材质索引失败: ${(error as Error).message}`;
      throw error;
    } finally {
      this.state.isLoading = false;
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
    
    try {
      this.state.isLoading = true;
      
      const response = await fetch(`${this.baseUrl}/${id}.json`);
      if (!response.ok) {
        throw new Error(`无法加载材质: ${response.statusText}`);
      }
      
      const serializedData = await response.json() as SerializedMaterial;
      const material = deserializeMaterial(serializedData);
      
      // 缓存已加载的材质
      this.state.loadedMaterials.set(id, material);
      
      return material;
    } catch (error) {
      this.state.error = `加载材质失败: ${(error as Error).message}`;
      throw error;
    } finally {
      this.state.isLoading = false;
    }
  }
  
  /**
   * 加载所有材质
   */
  async loadAllMaterials(): Promise<Map<string, TextMaterials>> {
    try {
      // 确保已加载索引
      if (this.state.collections.length === 0) {
        await this.loadIndex();
      }
      
      // 加载所有材质
      const loadPromises = this.state.collections.map(collection => 
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
    // 尝试加载材质索引，如果成功则认为材质已导出
    await materialLoader.loadIndex();
    return true;
  } catch (error) {
    console.warn('预设材质可能尚未导出到JSON:', error);
    return false;
  }
}