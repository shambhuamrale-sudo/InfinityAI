import { ReplicateImageProvider } from './ReplicateImageProvider.js'

/**
 * JuggernautXLProvider
 * --------------------
 * Juggernaut XL (by RunDiffusion) via Replicate. A flagship photoreal / artistic
 * SDXL fine-tune. Falls back to the local renderer when REPLICATE_API_TOKEN is
 * absent.
 */
export class JuggernautXLProvider extends ReplicateImageProvider {
  constructor(env = {}) {
    super({ ...env, id: 'juggernaut-xl', name: 'Juggernaut XL (Replicate)' })
    this._models = [
      { id: 'rundiffusion/juggernaut-xl-v9', name: 'Juggernaut XL v9', speed: 'medium', quality: 'excellent' },
      { id: 'rundiffusion/juggernaut-xl-v8', name: 'Juggernaut XL v8', speed: 'medium', quality: 'excellent' }
    ]
  }

  resolveModel(model) {
    const known = this._models.map((m) => m.id)
    return model && known.includes(model) ? model : 'rundiffusion/juggernaut-xl-v9'
  }

  buildGenerateInput(params) {
    const input = super.buildGenerateInput({ ...params, model: this.resolveModel(params.model) })
    input.num_inference_steps = Number.isFinite(params.steps) ? Number(params.steps) : 30
    input.guidance_scale = Number.isFinite(params.guidanceScale) ? Number(params.guidanceScale) : 7
    input.scheduler = 'K_EULER'
    input.Style = 'Photorealistic'
    return input
  }
}

export default JuggernautXLProvider
