import { TileType, TILE_SIZE, CharacterState } from '../types.js'
import type { TileType as TileTypeVal, FurnitureInstance, Character, SpriteData, Seat, FloorColor } from '../types.js'
import { getCachedSprite } from '../sprites/spriteCache.js'
import {
  GHOST_PREVIEW_SPRITE_ALPHA,
  GHOST_PREVIEW_TINT_ALPHA,
  SELECTION_DASH_PATTERN,
  BUTTON_MIN_RADIUS,
  BUTTON_RADIUS_ZOOM_FACTOR,
  BUTTON_ICON_SIZE_FACTOR,
  BUTTON_LINE_WIDTH_MIN,
  BUTTON_LINE_WIDTH_ZOOM_FACTOR,
  GRID_LINE_COLOR,
  VOID_TILE_OUTLINE_COLOR,
  VOID_TILE_DASH_PATTERN,
  GHOST_BORDER_HOVER_FILL,
  GHOST_BORDER_HOVER_STROKE,
  GHOST_BORDER_STROKE,
  GHOST_VALID_TINT,
  GHOST_INVALID_TINT,
  SELECTION_HIGHLIGHT_COLOR,
  DELETE_BUTTON_BG,
  ROTATE_BUTTON_BG,
} from '../../constants.js'

// ── Orb palette ────────────────────────────────────────────────

const ORB_COLORS = [
  '#00e5ff', // cyan
  '#00ff87', // green
  '#ff9f43', // orange
  '#c084fc', // purple
  '#2dd4bf', // teal
  '#f472b6', // pink
  '#60a5fa', // blue
  '#fbbf24', // amber
]

function getOrbColor(paletteIndex: number): string {
  return ORB_COLORS[paletteIndex % ORB_COLORS.length]
}

// ── Orb drawing helpers ────────────────────────────────────────

function drawOrb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  intensity: number,
  alpha: number,
): void {
  ctx.save()
  ctx.globalAlpha = alpha

  // Outer glow
  const glowRadius = radius * (1.5 + intensity * 0.5)
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius)
  glow.addColorStop(0, color)
  glow.addColorStop(0.4, color + '60')
  glow.addColorStop(1, color + '00')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2)
  ctx.fill()

  // Core orb
  const core = ctx.createRadialGradient(cx, cy - radius * 0.2, radius * 0.1, cx, cy, radius)
  core.addColorStop(0, '#ffffff')
  core.addColorStop(0.3, color)
  core.addColorStop(1, color + '80')
  ctx.fillStyle = core
  ctx.shadowColor = color
  ctx.shadowBlur = radius * intensity * 2
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawWarningRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  time: number,
): void {
  ctx.save()
  const ringRadius = radius * 1.6
  ctx.strokeStyle = '#ffaa00'
  ctx.lineWidth = 2
  ctx.shadowColor = '#ffaa00'
  ctx.shadowBlur = 8
  ctx.setLineDash([4, 4])
  ctx.lineDashOffset = -time * 40
  ctx.beginPath()
  ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawSelectedRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  time: number,
): void {
  ctx.save()
  const ringRadius = radius * 1.5
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.lineDashOffset = -time * 30
  ctx.beginPath()
  ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

// ── Zone labels ────────────────────────────────────────────────

const ZONE_LABELS = ['Code Review', 'Research', 'Planning']

// ── Render functions ────────────────────────────────────────────

export function renderTileGrid(
  ctx: CanvasRenderingContext2D,
  tileMap: TileTypeVal[][],
  offsetX: number,
  offsetY: number,
  zoom: number,
  _tileColors?: Array<FloorColor | null>,
  cols?: number,
): void {
  const s = TILE_SIZE * zoom
  const tmRows = tileMap.length
  const tmCols = tmRows > 0 ? tileMap[0].length : 0
  const layoutCols = cols ?? tmCols

  // Dark background fill for the grid area
  ctx.fillStyle = '#080c18'
  ctx.fillRect(offsetX, offsetY, layoutCols * s, tmRows * s)

  // Faint grid lines
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let c = 0; c <= layoutCols; c++) {
    const x = offsetX + c * s + 0.5
    ctx.moveTo(x, offsetY)
    ctx.lineTo(x, offsetY + tmRows * s)
  }
  for (let r = 0; r <= tmRows; r++) {
    const y = offsetY + r * s + 0.5
    ctx.moveTo(offsetX, y)
    ctx.lineTo(offsetX + layoutCols * s, y)
  }
  ctx.stroke()

  // Zone divider lines (split into thirds vertically)
  const zoneCount = Math.min(3, layoutCols)
  if (zoneCount > 1) {
    ctx.save()
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 4])
    const zoneCols = layoutCols / zoneCount
    for (let z = 1; z < zoneCount; z++) {
      const x = offsetX + Math.round(zoneCols * z) * s + 0.5
      ctx.beginPath()
      ctx.moveTo(x, offsetY)
      ctx.lineTo(x, offsetY + tmRows * s)
      ctx.stroke()
    }
    ctx.restore()
  }

  // Zone labels
  const labelFontSize = Math.max(10, Math.round(12 * zoom))
  ctx.save()
  ctx.font = `${labelFontSize}px monospace`
  ctx.fillStyle = 'rgba(0, 229, 255, 0.25)'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const zoneCols = layoutCols / Math.min(3, layoutCols)
  for (let z = 0; z < Math.min(3, layoutCols); z++) {
    const label = ZONE_LABELS[z] || ''
    const lx = offsetX + Math.round(zoneCols * z) * s + 6 * zoom
    const ly = offsetY + 4 * zoom
    ctx.fillText(label, lx, ly)
  }
  ctx.restore()
}

// Track time for animations
let animationTime = 0
const animStart = performance.now()

function getTime(): number {
  animationTime = (performance.now() - animStart) / 1000
  return animationTime
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  _furniture: FurnitureInstance[],
  characters: Character[],
  offsetX: number,
  offsetY: number,
  zoom: number,
  selectedAgentId: number | null,
  hoveredAgentId: number | null,
): void {
  const time = getTime()
  const orbRadius = Math.max(6, TILE_SIZE * zoom * 0.35)

  // Characters as orbs (no furniture rendering)
  for (const ch of characters) {
    const cx = offsetX + ch.x * zoom
    const cy = offsetY + ch.y * zoom
    const color = getOrbColor(ch.palette)

    // Spawn/despawn fade+scale
    let alpha = 1.0
    let scale = 1.0
    if (ch.matrixEffect) {
      const progress = ch.matrixEffectTimer
      if (ch.matrixEffect === 'spawn') {
        alpha = Math.min(1, progress * 3)
        scale = 0.3 + 0.7 * Math.min(1, progress * 2)
      } else {
        alpha = Math.max(0, 1 - progress * 3)
        scale = 1 - 0.5 * Math.min(1, progress * 2)
      }
    }

    // State-based glow intensity
    let intensity = 0.4 // idle default
    if (ch.state === CharacterState.TYPE) {
      // Active/typing: pulsing glow
      intensity = 0.6 + 0.3 * Math.sin(time * 3 + ch.id)
    } else if (ch.state === CharacterState.WALK) {
      intensity = 0.5
    }

    const r = orbRadius * scale
    drawOrb(ctx, cx, cy, r, color, intensity, alpha)

    // Permission state: amber warning ring
    if (ch.bubbleType === 'permission') {
      drawWarningRing(ctx, cx, cy, r, time)
    }

    // Selected orb: dashed ring
    const isSelected = selectedAgentId !== null && ch.id === selectedAgentId
    if (isSelected) {
      drawSelectedRing(ctx, cx, cy, r, time)
    }

    // Hovered orb: subtle brightening ring
    const isHovered = hoveredAgentId !== null && ch.id === hoveredAgentId
    if (isHovered && !isSelected) {
      ctx.save()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
  }
}

// ── Seat indicators (no-op in dashboard theme) ──────────────────

export function renderSeatIndicators(
  _ctx: CanvasRenderingContext2D,
  _seats: Map<string, Seat>,
  _characters: Map<number, Character>,
  _selectedAgentId: number | null,
  _hoveredTile: { col: number; row: number } | null,
  _offsetX: number,
  _offsetY: number,
  _zoom: number,
): void {
  // No-op: orb selection ring replaces seat highlights
}

// ── Edit mode overlays ──────────────────────────────────────────

export function renderGridOverlay(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  zoom: number,
  cols: number,
  rows: number,
  tileMap?: TileTypeVal[][],
): void {
  const s = TILE_SIZE * zoom
  ctx.strokeStyle = GRID_LINE_COLOR
  ctx.lineWidth = 1
  ctx.beginPath()
  // Vertical lines -- offset by 0.5 for crisp 1px lines
  for (let c = 0; c <= cols; c++) {
    const x = offsetX + c * s + 0.5
    ctx.moveTo(x, offsetY)
    ctx.lineTo(x, offsetY + rows * s)
  }
  // Horizontal lines
  for (let r = 0; r <= rows; r++) {
    const y = offsetY + r * s + 0.5
    ctx.moveTo(offsetX, y)
    ctx.lineTo(offsetX + cols * s, y)
  }
  ctx.stroke()

  // Draw faint dashed outlines on VOID tiles
  if (tileMap) {
    ctx.save()
    ctx.strokeStyle = VOID_TILE_OUTLINE_COLOR
    ctx.lineWidth = 1
    ctx.setLineDash(VOID_TILE_DASH_PATTERN)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (tileMap[r]?.[c] === TileType.VOID) {
          ctx.strokeRect(offsetX + c * s + 0.5, offsetY + r * s + 0.5, s - 1, s - 1)
        }
      }
    }
    ctx.restore()
  }
}

/** Draw faint expansion placeholders 1 tile outside grid bounds (ghost border). */
export function renderGhostBorder(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  zoom: number,
  cols: number,
  rows: number,
  ghostHoverCol: number,
  ghostHoverRow: number,
): void {
  const s = TILE_SIZE * zoom
  ctx.save()

  // Collect ghost border tiles: one ring around the grid
  const ghostTiles: Array<{ c: number; r: number }> = []
  // Top and bottom rows
  for (let c = -1; c <= cols; c++) {
    ghostTiles.push({ c, r: -1 })
    ghostTiles.push({ c, r: rows })
  }
  // Left and right columns (excluding corners already added)
  for (let r = 0; r < rows; r++) {
    ghostTiles.push({ c: -1, r })
    ghostTiles.push({ c: cols, r })
  }

  for (const { c, r } of ghostTiles) {
    const x = offsetX + c * s
    const y = offsetY + r * s
    const isHovered = c === ghostHoverCol && r === ghostHoverRow
    if (isHovered) {
      ctx.fillStyle = GHOST_BORDER_HOVER_FILL
      ctx.fillRect(x, y, s, s)
    }
    ctx.strokeStyle = isHovered ? GHOST_BORDER_HOVER_STROKE : GHOST_BORDER_STROKE
    ctx.lineWidth = 1
    ctx.setLineDash(VOID_TILE_DASH_PATTERN)
    ctx.strokeRect(x + 0.5, y + 0.5, s - 1, s - 1)
  }

  ctx.restore()
}

export function renderGhostPreview(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteData,
  col: number,
  row: number,
  valid: boolean,
  offsetX: number,
  offsetY: number,
  zoom: number,
): void {
  const cached = getCachedSprite(sprite, zoom)
  const x = offsetX + col * TILE_SIZE * zoom
  const y = offsetY + row * TILE_SIZE * zoom
  ctx.save()
  ctx.globalAlpha = GHOST_PREVIEW_SPRITE_ALPHA
  ctx.drawImage(cached, x, y)
  // Tint overlay
  ctx.globalAlpha = GHOST_PREVIEW_TINT_ALPHA
  ctx.fillStyle = valid ? GHOST_VALID_TINT : GHOST_INVALID_TINT
  ctx.fillRect(x, y, cached.width, cached.height)
  ctx.restore()
}

export function renderSelectionHighlight(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  w: number,
  h: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
): void {
  const s = TILE_SIZE * zoom
  const x = offsetX + col * s
  const y = offsetY + row * s
  ctx.save()
  ctx.strokeStyle = SELECTION_HIGHLIGHT_COLOR
  ctx.lineWidth = 2
  ctx.setLineDash(SELECTION_DASH_PATTERN)
  ctx.strokeRect(x + 1, y + 1, w * s - 2, h * s - 2)
  ctx.restore()
}

export function renderDeleteButton(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  w: number,
  _h: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
): DeleteButtonBounds {
  const s = TILE_SIZE * zoom
  // Position at top-right corner of selected furniture
  const cx = offsetX + (col + w) * s + 1
  const cy = offsetY + row * s - 1
  const radius = Math.max(BUTTON_MIN_RADIUS, zoom * BUTTON_RADIUS_ZOOM_FACTOR)

  // Circle background
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fillStyle = DELETE_BUTTON_BG
  ctx.fill()

  // X mark
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = Math.max(BUTTON_LINE_WIDTH_MIN, zoom * BUTTON_LINE_WIDTH_ZOOM_FACTOR)
  ctx.lineCap = 'round'
  const xSize = radius * BUTTON_ICON_SIZE_FACTOR
  ctx.beginPath()
  ctx.moveTo(cx - xSize, cy - xSize)
  ctx.lineTo(cx + xSize, cy + xSize)
  ctx.moveTo(cx + xSize, cy - xSize)
  ctx.lineTo(cx - xSize, cy + xSize)
  ctx.stroke()
  ctx.restore()

  return { cx, cy, radius }
}

export function renderRotateButton(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  _w: number,
  _h: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
): RotateButtonBounds {
  const s = TILE_SIZE * zoom
  // Position to the left of the delete button (which is at top-right corner)
  const radius = Math.max(BUTTON_MIN_RADIUS, zoom * BUTTON_RADIUS_ZOOM_FACTOR)
  const cx = offsetX + col * s - 1
  const cy = offsetY + row * s - 1

  // Circle background
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fillStyle = ROTATE_BUTTON_BG
  ctx.fill()

  // Circular arrow icon
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = Math.max(BUTTON_LINE_WIDTH_MIN, zoom * BUTTON_LINE_WIDTH_ZOOM_FACTOR)
  ctx.lineCap = 'round'
  const arcR = radius * BUTTON_ICON_SIZE_FACTOR
  ctx.beginPath()
  // Draw a 270-degree arc
  ctx.arc(cx, cy, arcR, -Math.PI * 0.8, Math.PI * 0.7)
  ctx.stroke()
  // Draw arrowhead at the end of the arc
  const endAngle = Math.PI * 0.7
  const endX = cx + arcR * Math.cos(endAngle)
  const endY = cy + arcR * Math.sin(endAngle)
  const arrowSize = radius * 0.35
  ctx.beginPath()
  ctx.moveTo(endX + arrowSize * 0.6, endY - arrowSize * 0.3)
  ctx.lineTo(endX, endY)
  ctx.lineTo(endX + arrowSize * 0.7, endY + arrowSize * 0.5)
  ctx.stroke()
  ctx.restore()

  return { cx, cy, radius }
}

// ── Speech bubbles (no-op in dashboard theme) ───────────────────

export function renderBubbles(
  _ctx: CanvasRenderingContext2D,
  _characters: Character[],
  _offsetX: number,
  _offsetY: number,
  _zoom: number,
): void {
  // No-op: permission state is shown as amber ring around orb;
  // ToolOverlay HTML handles text info
}

export interface ButtonBounds {
  /** Center X in device pixels */
  cx: number
  /** Center Y in device pixels */
  cy: number
  /** Radius in device pixels */
  radius: number
}

export type DeleteButtonBounds = ButtonBounds
export type RotateButtonBounds = ButtonBounds

export interface EditorRenderState {
  showGrid: boolean
  ghostSprite: SpriteData | null
  ghostCol: number
  ghostRow: number
  ghostValid: boolean
  selectedCol: number
  selectedRow: number
  selectedW: number
  selectedH: number
  hasSelection: boolean
  isRotatable: boolean
  /** Updated each frame by renderDeleteButton */
  deleteButtonBounds: DeleteButtonBounds | null
  /** Updated each frame by renderRotateButton */
  rotateButtonBounds: RotateButtonBounds | null
  /** Whether to show ghost border (expansion tiles outside grid) */
  showGhostBorder: boolean
  /** Hovered ghost border tile col (-1 to cols) */
  ghostBorderHoverCol: number
  /** Hovered ghost border tile row (-1 to rows) */
  ghostBorderHoverRow: number
}

export interface SelectionRenderState {
  selectedAgentId: number | null
  hoveredAgentId: number | null
  hoveredTile: { col: number; row: number } | null
  seats: Map<string, Seat>
  characters: Map<number, Character>
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  tileMap: TileTypeVal[][],
  _furniture: FurnitureInstance[],
  characters: Character[],
  zoom: number,
  panX: number,
  panY: number,
  selection?: SelectionRenderState,
  editor?: EditorRenderState,
  tileColors?: Array<FloorColor | null>,
  layoutCols?: number,
  layoutRows?: number,
): { offsetX: number; offsetY: number } {
  // Clear
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // Use layout dimensions (fallback to tileMap size)
  const cols = layoutCols ?? (tileMap.length > 0 ? tileMap[0].length : 0)
  const rows = layoutRows ?? tileMap.length

  // Center map in viewport + pan offset (integer device pixels)
  const mapW = cols * TILE_SIZE * zoom
  const mapH = rows * TILE_SIZE * zoom
  const offsetX = Math.floor((canvasWidth - mapW) / 2) + Math.round(panX)
  const offsetY = Math.floor((canvasHeight - mapH) / 2) + Math.round(panY)

  // Draw dashboard grid background
  renderTileGrid(ctx, tileMap, offsetX, offsetY, zoom, tileColors, layoutCols)

  // Seat indicators (no-op in dashboard theme)
  if (selection) {
    renderSeatIndicators(ctx, selection.seats, selection.characters, selection.selectedAgentId, selection.hoveredTile, offsetX, offsetY, zoom)
  }

  // Draw orbs (skip furniture - no visual rendering in dashboard theme)
  const selectedId = selection?.selectedAgentId ?? null
  const hoveredId = selection?.hoveredAgentId ?? null
  renderScene(ctx, [], characters, offsetX, offsetY, zoom, selectedId, hoveredId)

  // Speech bubbles (no-op in dashboard theme)
  renderBubbles(ctx, characters, offsetX, offsetY, zoom)

  // Editor overlays
  if (editor) {
    if (editor.showGrid) {
      renderGridOverlay(ctx, offsetX, offsetY, zoom, cols, rows, tileMap)
    }
    if (editor.showGhostBorder) {
      renderGhostBorder(ctx, offsetX, offsetY, zoom, cols, rows, editor.ghostBorderHoverCol, editor.ghostBorderHoverRow)
    }
    if (editor.ghostSprite && editor.ghostCol >= 0) {
      renderGhostPreview(ctx, editor.ghostSprite, editor.ghostCol, editor.ghostRow, editor.ghostValid, offsetX, offsetY, zoom)
    }
    if (editor.hasSelection) {
      renderSelectionHighlight(ctx, editor.selectedCol, editor.selectedRow, editor.selectedW, editor.selectedH, offsetX, offsetY, zoom)
      editor.deleteButtonBounds = renderDeleteButton(ctx, editor.selectedCol, editor.selectedRow, editor.selectedW, editor.selectedH, offsetX, offsetY, zoom)
      if (editor.isRotatable) {
        editor.rotateButtonBounds = renderRotateButton(ctx, editor.selectedCol, editor.selectedRow, editor.selectedW, editor.selectedH, offsetX, offsetY, zoom)
      } else {
        editor.rotateButtonBounds = null
      }
    } else {
      editor.deleteButtonBounds = null
      editor.rotateButtonBounds = null
    }
  }

  return { offsetX, offsetY }
}
