import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { generateManifest } from './scripts/generate-manifest.mjs'

function dataManifestWatcher() {
    let isGenerating = false

    const isDataPath = (file) => file.includes(`${path.sep}public${path.sep}data${path.sep}`)
    const isManifest = (file) => file.endsWith(`${path.sep}public${path.sep}data${path.sep}manifest.json`)

    const updateManifestAndReload = async (server, file) => {
        if (!isDataPath(file) || isManifest(file) || isGenerating) {
            return
        }

        isGenerating = true
        try {
            await generateManifest()
            server.ws.send({ type: 'full-reload' })
        } catch (error) {
            console.error('Failed to regenerate manifest on data change:', error)
        } finally {
            isGenerating = false
        }
    }

    return {
        name: 'data-manifest-watcher',
        async configureServer(server) {
            await generateManifest()

            const onChange = (file) => {
                updateManifestAndReload(server, file)
            }

            server.watcher.on('add', onChange)
            server.watcher.on('change', onChange)
            server.watcher.on('unlink', onChange)
            server.watcher.on('addDir', onChange)
            server.watcher.on('unlinkDir', onChange)
        }
    }
}

export default defineConfig({
    base: '/Portfolio/',
    plugins: [react(), tailwindcss(), dataManifestWatcher()],
})
