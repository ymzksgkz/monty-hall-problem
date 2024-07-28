import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

interface Option {
  isPlayerChoose: boolean
  isCorrect: boolean
}
type ChooseRandom1 = (optionLength: number) => number
type GenerateOptions = (optionLength: number) => Option[]
type RemoveBadOptions = (options: Option[]) => Option[]
type DoMontyHall = (optionLength: number, isChangeOption: boolean) => boolean
type ParseArgs = () => { TIMES: number; LENGTH: number; IS_CHANGE_OPTION: boolean }
type Main = () => void

// 決められた配列の範囲からランダムに１つを選択する
const chooseRandom1: ChooseRandom1 = (optionLength) => Math.floor(Math.random() * optionLength)

// 正解が１つだけ設定された配列を返す
const generateOptions: GenerateOptions = (optionLength) => {
  // 正解の要素番号をランダムに決定する
  const correctIndex = chooseRandom1(optionLength)
  // 正解なら true, ハズレなら false を設定する
  return Array.from({ length: optionLength }, (_, i) => ({
    isPlayerChoose: false,
    isCorrect: i === correctIndex
  }))
}

// 選択したもの以外のハズレを全て選択肢から外す
const removeBadOptions: RemoveBadOptions = (options) => {
  // 自分が１回目で正解を選択している場合
  if (options.some((option) => option.isCorrect && option.isPlayerChoose)) {
    let remainingOptionIndex = -1 // まだ不定
    const correctOptionIndex = options.findIndex(({ isCorrect }) => isCorrect)

    // 正解ではない要素が選ばれるまでランダムに要素を抽出する
    while (remainingOptionIndex === -1) {
      const randomIndex = chooseRandom1(options.length)

      // 正解と違う要素が選ばれたら残す要素を選択して終了
      if (randomIndex !== correctOptionIndex) remainingOptionIndex = randomIndex
    }

    return options.filter((option, i) => {
      // 正解（= この場合は選択した要素でもある）は必ず残す
      if (option.isCorrect) return true

      // 不正解の要素も１つ残す
      if (i === remainingOptionIndex) return true

      return false
    })
  }

  // 自分が１回目ではずれを選択している場合
  return options.filter(option => {
    // 正解は必ず残す
    if (option.isCorrect) return true

    // 選択した要素は必ず残す
    if (option.isPlayerChoose) return true

    return false
  })
}

const doMontyHall: DoMontyHall = (optionLength, isChangeOption) => {
  // 選択肢生成
  const options = generateOptions(optionLength)

  // 最初の選択肢を選ぶ
  options[chooseRandom1(options.length)].isPlayerChoose = true

  // 正解とハズレの 2 つの選択肢に絞る
  const filteredOptions = removeBadOptions(options)

  // 最初に選んでいない方に選択肢を変える場合こちらで処理
  if (isChangeOption) {
    // この時点で残っている選択肢の数は 2 つなので単純に選択している要素を反転させる
    filteredOptions.forEach((option) => {
      option.isPlayerChoose = !option.isPlayerChoose
    })
  }

  // 最終的結果
  const resultOption = filteredOptions.find((option) => option.isPlayerChoose)

  // 処理が正確だったかを確認
  if (options.length !== optionLength) throw new Error('選択肢が optionLength の数と異なる')
  if (filteredOptions.length !== 2) throw new Error('除外後の選択肢が2つになっていない')
  if (filteredOptions.filter((option) => option.isCorrect).length !== 1) throw new Error('正解が１つになっていない')
  if (typeof resultOption.isCorrect !== 'boolean') throw new Error('結果が boolean ではない')

  // 正解なら true, 不正解なら false を返す
  return resultOption.isCorrect
}

// コマンドライン引数を取得する
const parseArgs: ParseArgs = () => {
  const { times, length, change } = yargs(hideBin(process.argv))
    .options('length', {
      alias: 'l',
      type: 'number',
      description: '選択肢の数',
      default: 3
    })
    .options('times', {
      alias: 't',
      type: 'number',
      description: '試行回数',
      default: 100
    })
    .options('change', {
      alias: 'c',
      type: 'boolean',
      description: '選択肢を変更する場合 true, 変更しない場合 false',
      default: true
    })
    .strict()
    .parseSync()
  return { TIMES: times, LENGTH: length, IS_CHANGE_OPTION: change }
}

const main: Main = () => {
  const { LENGTH, TIMES, IS_CHANGE_OPTION } = parseArgs()

  // 規定回数繰り返して結果を集計する
  const results = Array.from({ length: TIMES }, () => doMontyHall(LENGTH, IS_CHANGE_OPTION))
  // 結果が true であった割合
  const winRate = results.filter((result) => result === true).length / TIMES

  console.log('=====================================================================\n')
  console.log(
    `条件: 選択肢の数: ${LENGTH}個, 試行回数: ${TIMES}回, 2回目の選択を行う: ${IS_CHANGE_OPTION ? '行う' : '行わない'}`
  )
  console.log('結果:', `勝率 ${Math.round(winRate * 10000) / 100}%`)
  console.log('\n=====================================================================')
}
main()
