/**
 * @ignore
 * BEGIN HEADER
 *
 * Contains:        FileMoveTO command
 * CVM-Role:        <none>
 * Maintainer:      Hendrik Erz
 * License:         GNU GPL v3
 *
 * Description:     This command moves a file into a chosen directory.
 *
 * END HEADER
 */

import ZettlrCommand from './zettlr-command'
import { trans } from '@common/i18n-main'
import path from 'path'
import type { AppServiceContainer } from 'source/app/app-service-container'

export default class FileMoveTO extends ZettlrCommand {
  constructor (app: AppServiceContainer) {
    super(app, 'file-move-to')
  }

  async run (_evt: string, arg: { path: string, targetDir: string }): Promise<void> {
    //Ensure move source still exists
    
    if (!await this._app.fsal.isFile(arg.path)) {
      this._app.log.error(`[FileMoveTO] Source file not found: ${arg.path}`)
      this._app.windows.prompt({
        type: 'error',
        title: trans('Could not move file'),
        message: trans('Source file not found.')
      })
      return
    }
    // skip no-op moves within current directory
    if (path.dirname(arg.path) === arg.targetDir) {
      return
    }
    //keep filename while relocating parent directory
    const oldPath = arg.path
    const filename = path.basename(oldPath)
    const newPath = path.join(arg.targetDir, filename)
    //reject collisons to avoid accidental overwrite
    if (await this._app.fsal.pathExists(newPath)) {
      this._app.windows.prompt({
        type: 'error',
        title: trans('Could not move file'),
        message: trans('A file named %s already exists in the target directory.', filename)
      })
      return
    }
    //Prevent moving unsaved buffers out of sync
    if (this._app.documents.isModified(arg.path)) {
      this._app.windows.prompt({
        type: 'error',
        title: trans('Could not move file'),
        message: trans('Cannot move a modified file. Please save it first.')
      })
      return
    }
    //Move file and sync open document references
    await this._app.fsal.rename(oldPath, newPath)
    await this._app.documents.hasMovedFile(oldPath, newPath)
  }
}
