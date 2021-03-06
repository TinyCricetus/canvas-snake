import { GameConfig } from "./config"
import { Position } from "./definition"

export interface SnakeDrawData {
  snake: Position[],
  oldSnake: Position[],
  /** 移动一步的进度 满额为100% */
  oneStepProgress?: number
}

interface Grid {
  sideLengthX: number
  sideLengthY: number

  topLeftPoint: {
    x: number,
    y: number
  }
}
/**
 * 方格渲染器
 * 
 * 此渲染器将指定宽高的配置栅格化，形成由多个方块构成的绘图区域，使用时只需要传入指定的坐标的即可绘制指定方格区域
 */
export class Renderer {
  private gridSideLengthX
  private gridSideLengthY
  private gameGround: Grid[][]

  private foodAnimationBeginTs = 0
  private foodAnimationEndTs = 0

  constructor(private ctx: CanvasRenderingContext2D, private gameConfig: GameConfig) {
    this.gridSideLengthX = this.gameConfig.gameWidth / this.gameConfig.gridSize
    this.gridSideLengthY = this.gameConfig.gameHeight / this.gameConfig.gridSize
    this.gameGround = this.getGameGround()
  }

  drawGrid(position: Position, fillStyle: string, width: number, height: number) {
    this.ctx.save()
    this.ctx.beginPath()

    const grid = this.gameGround[position.x]?.[position.y]
    if (!grid) {
      throw new Error('The position is invalid!')
    }

    this.ctx.fillStyle = fillStyle
    this.ctx.fillRect(grid.topLeftPoint.x, grid.topLeftPoint.y, width, height)

    this.ctx.restore()
  }

  drawGround() {
    this.ctx.save()
    this.ctx.beginPath()

    let tempWidth = 0
    let tempHeight = 0
    for (let i = 0; i < this.gameConfig.gridSize; i++) {
      tempWidth += this.gridSideLengthX
      tempHeight += this.gridSideLengthY
      this.ctx.moveTo(tempWidth, 0)
      this.ctx.lineTo(tempWidth, this.gameConfig.gameHeight)
      this.ctx.moveTo(0, tempHeight)
      this.ctx.lineTo(this.gameConfig.gameWidth, tempHeight)
    }

    this.ctx.strokeStyle = this.gameConfig.groundLineColor
    this.ctx.stroke()

    this.ctx.restore()
  }

  drawFood(food: Position, oldFood: Position, timestampNow: number) {
    this.ctx.save()
    this.ctx.beginPath()

    this.ctx.fillStyle = this.gameConfig.foodColor
    const grid = this.gameGround[food.x][food.y]
    const radius = Math.floor(grid.sideLengthX / 2)

    if (timestampNow <= this.foodAnimationEndTs && this.foodAnimationEndTs > 0) {
      const oldGrid = this.gameGround[oldFood.x][oldFood.y]
      const progress = Math.floor((timestampNow - this.foodAnimationBeginTs) / (this.foodAnimationEndTs - this.foodAnimationBeginTs) * 10000) / 10000
      const offsetX = Math.floor((grid.topLeftPoint.x - oldGrid.topLeftPoint.x) * progress)
      const offsetY = Math.floor((grid.topLeftPoint.y - oldGrid.topLeftPoint.y) * progress)
      this.ctx.arc(oldGrid.topLeftPoint.x + radius + offsetX, oldGrid.topLeftPoint.y + radius + offsetY, radius, 0, 2 * Math.PI)
    } else {
      this.ctx.arc(grid.topLeftPoint.x + radius, grid.topLeftPoint.y + radius, radius, 0, 2 * Math.PI)
    }

    this.ctx.fill()

    this.ctx.restore()
  }

  enableFoodEscapeAnimationOnce(beginTimestamp: number) {
    const duration = 600 // ms
    this.foodAnimationBeginTs = beginTimestamp
    this.foodAnimationEndTs = beginTimestamp + duration
  }

  playFoodEatenAnimationOnce(food: Position) {
    const duration = 500 // ms
    this.playFoodEatenAnimation(food, Date.now(), duration)
  }

  playFoodEatenAnimation(food: Position, beginTs: number, duration: number) {
    const now = Date.now()
    if (now - beginTs >= duration) {
      return
    }

    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.fillStyle = this.gameConfig.foodColor

    const grid = this.gameGround[food.x][food.y]
    const radius = Math.floor(grid.sideLengthX / 2)
    const progress = Math.floor((now - beginTs) / (duration) * 10000) / 10000
    const offset = Math.floor(radius * progress)

    this.ctx.arc(grid.topLeftPoint.x + radius, grid.topLeftPoint.y + radius, radius + offset, 0, 2 * Math.PI)
    this.ctx.fill()

    this.ctx.restore()
    requestAnimationFrame(() => {
      this.playFoodEatenAnimation(food, beginTs, duration)
    })
  }

  drawSnake(data: SnakeDrawData) {
    this.ctx.save()
    this.ctx.beginPath()

    data.oneStepProgress = data.oneStepProgress || 0

    let selectedGrid: Grid = null
    let oldSelectedGrid: Grid = null

    let position: Position = null
    let oldPosition: Position = null

    let offsetX = 0
    let offsetY = 0

    let currentX = 0
    let currentY = 0
    let radius = 0
    for (let i = 0; i < data.oldSnake.length; i++) {
      position = data.snake[i]
      oldPosition = data.oldSnake[i]

      if (!this.gameGround[oldPosition.x] || !this.gameGround[oldPosition.x][oldPosition.y]) {
        console.error(oldPosition)
        throw new Error('Snake body is out of game ground!')
      }

      oldSelectedGrid = this.gameGround[oldPosition.x][oldPosition.y]
      selectedGrid = this.gameGround[position.x][position.y]

      if (Math.abs(selectedGrid.topLeftPoint.x - oldSelectedGrid.topLeftPoint.x) > selectedGrid.sideLengthX ||
        Math.abs(selectedGrid.topLeftPoint.y - oldSelectedGrid.topLeftPoint.y) > selectedGrid.sideLengthY) {
        offsetX = 0
        offsetY = 0
      } else {
        offsetX = Math.floor((selectedGrid.topLeftPoint.x - oldSelectedGrid.topLeftPoint.x) * data.oneStepProgress / 100)
        offsetY = Math.floor((selectedGrid.topLeftPoint.y - oldSelectedGrid.topLeftPoint.y) * data.oneStepProgress / 100)
      }

      radius = Math.floor(selectedGrid.sideLengthX / 2)
      currentX = oldSelectedGrid.topLeftPoint.x + radius + offsetX
      currentY = oldSelectedGrid.topLeftPoint.y + radius + offsetY

      this.ctx.moveTo(currentX, currentY)
      this.ctx.arc(currentX, currentY, radius, 0, 2 * Math.PI)
      if (i === 0) {
        this.ctx.fillStyle = this.gameConfig.snakeHeadColor
        this.ctx.fill()
        this.ctx.beginPath()
      }
    }

    this.ctx.fillStyle = this.gameConfig.snakeBodyColor
    this.ctx.fill()

    this.ctx.restore()
  }

  clearSnake(snake: Position[]) {
    this.ctx.save()

    let selectedGrid = null
    for (const position of snake) {
      selectedGrid = this.gameGround[position.x][position.y]
      this.ctx.clearRect(selectedGrid.topLeftPoint.x, selectedGrid.topLeftPoint.y,
        selectedGrid.sideLengthX, selectedGrid.sideLengthY)
    }

    this.ctx.restore()
  }

  clearGround() {
    this.ctx.save()

    // 拖尾
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.fillRect(0, 0, this.gameConfig.gameWidth, this.gameConfig.gameHeight)

    this.ctx.restore()
  }

  private getGameGround() {
    const list: Array<Grid[]> = []
    for (let i = 0; i < this.gameConfig.gridSize; i++) {
      list.push([])
      for (let j = 0; j < this.gameConfig.gridSize; j++) {
        list[i][j] = {
          sideLengthX: this.gridSideLengthX,
          sideLengthY: this.gridSideLengthY,

          topLeftPoint: {
            x: i * this.gridSideLengthX,
            y: j * this.gridSideLengthY
          }
        }
      }
    }

    return list
  }
}