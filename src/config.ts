export interface GameConfig {
  /** 游戏宽度 单位 px */
  gameWidth: number
  
  /** 游戏高度 单位 px */
  gameHeight: number

  /** 游戏尺寸 x * x 大小 */
  gridSize: number

  snakeOriginLength: number

  /** 蛇速度，n 秒每格 */
  snakeSpeed: number

  /** @deprecated 蛇身体方格内宽 px */
  snakeGridPadding: number

  snakeHeadColor: string
  
  snakeBodyColor: string

  groundLineColor: string

  foodColor: string

  /** 食物逃逸间隔 单位 秒 */
  foodEscapeInterval: number,

  /** 食物与蛇的安全距离 单位 方格数 */
  foodSafeGrid: number
}

export const defaultGameConfig: GameConfig = {
  gameWidth: 500,
  gameHeight: 500,
  gridSize: 20,
  
  snakeOriginLength: 5,
  snakeSpeed: 0.2,
  snakeGridPadding: 1,
  
  snakeHeadColor: '#8D8DAA',
  snakeBodyColor: '#DFDFDE',

  groundLineColor: 'rgb(233, 231, 231)',

  foodColor: '#F56D91',
  foodEscapeInterval: 3,
  foodSafeGrid: 2
}