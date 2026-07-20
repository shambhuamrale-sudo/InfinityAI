import { ReplicateImageProvider } from './ReplicateImageProvider.js'

/**
 * FluxImageProvider
 * -----------------
 * FLUX.1 Dev and FLUX.1 Schnell via the Replicate API. Dev yields higher quality
 * (needs more steps), Schnell is the fast distilled variant. Both fall back to
 * the local renderer when REPLICATE_API_TOKEN is absent.
 */
export class FluxImageProvider extends ReplicateImageProvider {
  constructor(env = {}) {
    super({ ...env, id: 'flux', name: 'FLUX (Replicate)' })
    this._models = [
      { id: 'black-forest-labs/flux-dev', name: 'FLUX.1 Dev', speed: 'medium', quality: 'excellent' },
      { id: 'black-forest-labs/flux-schnell', name: 'FLUX.1 Schnell', speed: 'fast', quality: 'good' },
      { id: 'black-forest-labs/flux-1.1-pro', name: 'FLUX 1.1 Pro', speed: 'medium', quality: 'excellent' }
    ]
  }

  resolveModel(model) {
    const known = this._models.map((m) => m.id)
    return model && known.includes(model) ? model : 'black-forest-labs/flux-dev'
  }

  buildGenerateInput(params) {
    const input = super.buildGenerateInput({ ...params, model: this.resolveModel(params.model) })
    // FLUX.1-dev output format toggles.
    if (params.model === 'black-forest-labs/flux-schnell') input.num_inference_steps = Math.min(params.steps || 4, 8)
    return input
  }
}

export default FluxImageProvider
