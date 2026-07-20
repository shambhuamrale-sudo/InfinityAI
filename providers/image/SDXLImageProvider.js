import { ReplicateImageProvider } from './ReplicateImageProvider.js'

/**
 * SDXLImageProvider
 * -----------------
 * Stable Diffusion XL via Replicate (stability-ai/sdxl) or Stability AI. This
 * adapter prefers Replicate when REPLICATE_API_TOKEN is set; the manager's
 * fallback chain routes to the Stability provider otherwise.
 */
export class SDXLImageProvider extends ReplicateImageProvider {
  constructor(env = {}) {
    super({ ...env, id: 'sdxl', name: 'SDXL (Replicate)' })
    this._models = [
      { id: 'stability-ai/sdxl', name: 'SDXL 1.0 (Replicate)', speed: 'medium', quality: 'excellent' },
      { id: 'stability-ai/sdxl-lightning', name: 'SDXL Lightning', speed: 'fast', quality: 'good' }
    ]
  }

  resolveModel(model) {
    const known = this._models.map((m) => m.id)
    return model && known.includes(model) ? model : 'stability-ai/sdxl'
  }

  buildGenerateInput(params) {
    const input = super.buildGenerateInput({ ...params, model: this.resolveModel(params.model) })
    input.refiner = 'no'
    if (!Number.isFinite(params.steps)) input.num_inference_steps = 30
    return input
  }
}

export default SDXLImageProvider
