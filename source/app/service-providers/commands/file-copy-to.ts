/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        FileCopyTo command
 * CVM-Role:        <none>
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     This command copies a file into a chosen directory.
 *
 * END HEADER
 */

import ZettlrCommand from './zettlr-command'
import { trans } from '@common/i18n-main'
import path from 'path'
import type { AppServiceContainer } from 'source/app/app-service-container'

export default class FileCopyTo extends ZettlrCommand {
  constructor (app: AppServiceContainer) {
    super(app, 'file-copy-to')
  }

  async run (_evt: string, arg: { path: string, targetDir: string }): Promise<void> {
    // Validate source before resolving destination path
    if (!await this._app.fsal.isFile(arg.path)) {
      this._app.log.error(`[FileCopyTo] Source file not found: ${arg.path}`)
      this._app.windows.prompt({
        type: 'error',
        title: trans('Could not copy file'),
        message: trans('Source file not found.')
      })
      return
    }
    //perserve original filename in selected destination
    const filename = path.basename(arg.path)
    const targetPath = path.posix.join(arg.targetDir, filename)
    //Block overwrite to prevent unintended data loss
    if (await this._app.fsal.pathExists(targetPath)) {
      this._app.windows.prompt({
        type: 'error',
        title: trans('Could not copy file'),
        message: trans('A file named %s already exists in the target directory.', filename)
      })
      return
    }
    //Execute copy only after validation process
    await this._app.fsal.copyFile(arg.path, targetPath)
  }
}
