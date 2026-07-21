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
export { GroqProvider } from './GroqProvider.js'
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
export { CloudImageProvider } from './image/CloudImageProvider.js'
export { FluxImageProvider } from './image/FluxImageProvider.js'
export { SDXLImageProvider } from './image/SDXLImageProvider.js'
export { SD35ImageProvider } from './image/SD35ImageProvider.js'
export { JuggernautXLProvider } from './image/JuggernautXLProvider.js'
export { DreamShaperXLProvider } from './image/DreamShaperXLProvider.js'
export { RealisticVisionProvider } from './image/RealisticVisionProvider.js'
export { PlaygroundV2Provider } from './image/PlaygroundV2Provider.js'
export { ImageProviderManager, createImageProviderManager } from './image/ImageProviderManager.js'

import { createProviderManager } from './ProviderManager.js'
import { createImageProviderManager } from './image/ImageProviderManager.js'

const DEFAULT_PROVIDER = process.env.DEFAULT_PROVIDER || 'ollama'

/** Shared singleton used by the server. */
export const providerManager = createProviderManager({}, DEFAULT_PROVIDER)

/** Shared image-provider singleton used by the server. */
export const imageProviderManager = createImageProviderManager()
