import axios from 'axios';
import { GenerationParams, GenerationResult, GenerationError } from '../types/generation';
import config from '../../config/generation.json';

const api = axios.create({
  baseURL: config.api.endpoint,
  timeout: config.api.timeout,
});

export const generateImage = async (params: GenerationParams): Promise<GenerationResult> => {
  try {
    const response = await api.post('', {
      ...params,
      negative_prompt: params.negative_prompt || config.default_params.negative_prompt,
    });

    return {
      images: response.data.images,
      parameters: params,
      info: response.data.info,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        details: error.response?.data,
      } as GenerationError;
    }
    throw {
      message: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
    } as GenerationError;
  }
}; 