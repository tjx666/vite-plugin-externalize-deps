import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

interface UserOptions {
  deps: boolean,
  optionalDeps: boolean,
  peerDeps: boolean,
  useFile: string,
}

const parseFile = (file: string) => {
  return JSON.parse(readFileSync(file).toString())
}

export const externalizeDeps = (options: Partial<UserOptions> = {}): Plugin => {
  const optionsResolved: UserOptions = {
    deps: true,
    optionalDeps: true,
    peerDeps: true,
    useFile: join(process.cwd(), 'package.json'),
    // User options take priority.
    ...options,
  }

  return {
    name: 'vite-plugin-externalize-deps',
    config: (_config, _env) => {
      if (existsSync(optionsResolved.useFile)) {
        const externalDeps = new Set<RegExp>()
        const { dependencies = {}, optionalDependencies = {}, peerDependencies = {} } = parseFile(optionsResolved.useFile)

        if (optionsResolved.deps) {
          Object.keys(dependencies).forEach((dep) => {
            const depMatcher = new RegExp(`^${dep}(?:/.+)?$`)

            externalDeps.add(depMatcher)
          })
        }

        if (optionsResolved.optionalDeps) {
          Object.keys(optionalDependencies).forEach((dep) => {
            const depMatcher = new RegExp(`^${dep}(?:/.+)?$`)

            externalDeps.add(depMatcher)
          })
        }

        if (optionsResolved.peerDeps) {
          Object.keys(peerDependencies).forEach((dep) => {
            const depMatcher = new RegExp(`^${dep}(?:/.+)?$`)

            externalDeps.add(depMatcher)
          })
        }

        return {
          build: {
            rollupOptions: {
              external: [
                ...externalDeps.values(),
              ],
            },
          },
        }
      }
    },
  }
}
