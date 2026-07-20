import { ReplicateImageProvider } from './ReplicateImageProvider.js'

/**
 * RealisticVisionProvider
 * -----------------------
 * Realistic Vision (SDXL/SD1.5 fine-tune) via Replicate — tuned for lifelike
 * photography. Falls back to the local renderer when REPLICATE_API_TOKEN is
 * absent.
 */
export class RealisticVisionProvider extends ReplicateImageProvider {
  constructor(env = {}) {
    super({ ...env, id: 'realistic-vision', name: 'Realistic Vision (Replicate)' })
    this._models = [
      { id: 'lucataco/realistic-vision-v5', name: 'Realistic Vision v5', speed: 'medium', quality: 'excellent' },
      { id: 'lucataco/realistic-vision-v6', name: 'Realistic Vision v6', speed: 'medium', quality: 'excellent' }
    ]
  }

  resolveModel(model) {
    const known = this._models.map((m) => m.id)
    return model && known.includes(model) ? model : 'lucataco/realistic-vision-v5'
  }

  buildGenerateInput(params) {
    const input = super.buildGenerateInput({ ...params, model: this.resolveModel(params.model) })
    input.num_inference_steps = Number.isFinite(params.steps) ? Number(params.steps) : 30
    input.guidance_scale = Number.isFinite(params.guidanceScale) ? Number(params.guidanceScale) : 7.5
    return input
  }
}

export default RealisticVisionProvider
