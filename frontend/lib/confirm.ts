type ConfirmFn = (message: string, danger: boolean) => Promise<boolean>

let _openDialog: ConfirmFn | null = null

export function _registerConfirmDialog(fn: ConfirmFn | null) {
  _openDialog = fn
}

export function confirm(message: string, danger = true): Promise<boolean> {
  if (_openDialog) return _openDialog(message, danger)
  return Promise.resolve(window.confirm(message))
}
