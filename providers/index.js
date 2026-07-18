/**
 * Provider system public entry point.
 *
 * Import `providerManager` (a ready-to-use singleton) or `createProviderManager`
 * to build a custom instance in tests.
 */
export { BaseProvider } from './BaseProvider.js'
export { PlaceholderProvider } from './PlaceholderProvider.js'
export { OllamaProvider } from './OllamaProvider.js'
export { OpenAIProvider } from './OpenAIProvider.js'
export { GeminiProvider } from './GeminiProvider.js'
export { AnthropicProvider } from './AnthropicProvider.js'
export { DeepSeekProvider } from './DeepSeekProvider.js'
export { MistralProvider } from './MistralProvider.js'
export { OpenRouterProvider } from './OpenRouterProvider.js'
export { ProviderManager, createProviderManager } from './ProviderManager.js'

// ── Image provider system (Phase 4) ──────────────────────────────────────────
export { BaseImageProvider } from './image/BaseImageProvider.js'
export { PlaceholderImageProvider } from './image/PlaceholderImageProvider.js'
export { LocalImageProvider } from './image/LocalImageProvider.js'
export { ComfyUIProvider } from './image/ComfyUIProvider.js'
export { Automatic1111Provider } from './image/Automatic1111Provider.js'
export { OllamaImageProvider } from './image/OllamaImageProvider.js'
export { OpenAIImageProvider } from './image/OpenAIImageProvider.js'
export { StabilityImageProvider } from './image/StabilityImageProvider.js'
export { ReplicateImageProvider } from './image/ReplicateImageProvider.js'
export { HuggingFaceImageProvider } from './image/HuggingFaceImageProvider.js'
export { ImageProviderManager, createImageProviderManager } from './image/ImageProviderManager.js'

import { createProviderManager } from './ProviderManager.js'
import { createImageProviderManager } from './image/ImageProviderManager.js'

/** Shared singleton used by the server. */
export const providerManager = createProviderManager()

/** Shared image-provider singleton used by the server. */
export const imageProviderManager = createImageProviderManager()
