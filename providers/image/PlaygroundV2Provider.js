import { ReplicateImageProvider } from './ReplicateImageProvider.js'

/**
 * PlaygroundV2Provider
 * --------------------
 * Playground v2.5 (by Playground AI) via Replicate — a strong aesthetic SDXL
 * model. Falls back to the local renderer when REPLICATE_API_TOKEN is absent.
 */
export class PlaygroundV2Provider extends ReplicateImageProvider {
  constructor(env = {}) {
    super({ ...env, id: 'playground-v2', name: 'Playground v2 (Replicate)' })
    this._models = [
      { id: 'playgroundai/playground-v2.5-1024px-aesthetic', name: 'Playground v2.5', speed: 'medium', quality: 'excellent' },
      { id: 'playgroundai/playground-v2', name: 'Playground v2', speed: 'medium', quality: 'good' }
    ]
  }

  resolveModel(model) {
    const known = this._models.map((m) => m.id)
    return model && known.includes(model) ? model : 'playgroundai/playground-v2.5-1024px-aesthetic'
  }

  buildGenerateInput(params) {
    const input = super.buildGenerateInput({ ...params, model: this.resolveModel(params.model) })
    input.num_inference_steps = Number.isFinite(params.steps) ? Number(params.steps) : 30
    input.guidance_scale = Number.isFinite(params.guidanceScale) ? Number(params.guidanceScale) : 3
    input.scheduler = 'DPM++ 2M Karras'
    return input
  }
}

export default PlaygroundV2Provider
