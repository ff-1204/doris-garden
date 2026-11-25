// 도리의 정원 (Dori's Garden) — 게임 규칙 엔진: 조각 차례 ENGINE_PARTS · 공개 목록 Engine(api) (화면과 분리)
// P66(11-03): 엔진 몸은 조각 engine-*.js 10개로 나눔(예전 한 파일을 구역 순서 그대로). 조각끼리는 같은 이름 공간을 써요
// P94-05(11-26): 브라우저는 이 파일을 그대로 받지 않아요 — tools/engine-bundle.js가 조각 + 아래 공개 목록을 함수 하나로 묶은 글자를 engine.js로 줘요
//   (로컬은 serve.js, 배포는 build-site.js). 그래서 브라우저 전역에는 Engine 하나만 생겨요. index.html은 engine.js 한 줄만 불러요
// Node(테스트 · 도구의 require('../engine.js')): 이 파일이 vm으로 조각을 ENGINE_PARTS 차례로 펼쳐요 (Node 전역 이름 공간에)
// 조각을 더하거나 차례를 바꾸면 ENGINE_PARTS만 고치면 돼요 (묶음 · Node 둘 다 이 줄을 읽어요)
(function (root) {
'use strict';
const ENGINE_PARTS = ['engine-base.js', 'engine-state.js', 'engine-progress.js', 'engine-actions.js', 'engine-journal.js', 'engine-mine-mail.js', 'engine-decos.js', 'engine-auto.js', 'engine-long.js', 'engine-save.js'];
if (typeof calendar === 'undefined') {
  // 브라우저가 묶지 않은 이 파일을 받았어요 (serve.js가 아닌 서버로 소스 폴더를 열었을 때) — 조각이 없으니 여기서 멈춰요. 화면 코드도 Engine 없이 멈춰 저장은 일어나지 않아요
  if (typeof module === 'undefined' || !module.exports) throw new Error('묶지 않은 engine.js예요 — node flower-land/serve.js로 열거나 배포본(tools/build-site.js)을 쓰세요');
  // Node: 조각을 같은 전역 이름 공간에 차례로 (한 프로세스에서 두 번 불려도 다시 펼치지 않음)
  const fs = require('fs'), path = require('path'), vm = require('vm');
  for (const f of ENGINE_PARTS) { const file = path.join(__dirname, f); vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file }); }
}

// 공개 이름은 차례 그대로 여러 줄로 접어 둬요 — 새 이름은 맨 끝 줄에 더해요(스냅숏이 Object.keys 차례를 봐요)
const api = {
  DAILY_GIFT, HOUR, W, H, MONTHS, josa, SEASONS, MONTH_H, monthName, calendar, calendarAfterFlow, untilMonth, yearOf, canReset, resetKeys,
  FLOWERS, FLOWER_KEYS, FORM, LIFE, LANDS, LAND_KEYS, LIFE_MIN, classify, landOf, landCounts, flowerEconomy, harvestsPerYear, PETAL_BASE,
  ANT_PETALS_MAX, bagMul, harvestCount, antCount, bagPetals, ECON_Q,
  stars, pct, germOf, GERM_FULL_M, GERM_FADE_M, GERM_SOON_M, defaultRng, qualityRadius, stageRadius, STAGE, computeStage, landMatch, vigorOf,
  monthlyChange,
  teaShopOpen, hoursToShopOpen, TEA_PRICE_MUL, teaPriceKind, teaPriceMul, teaPriceText, CUP_SELL_H, STEEP_H, steepLeftH, cupSteeping, readyCups,
  steepText, SEATS, CUP_SETS, SIGNS, shopOf, cupSellH, addSeat, buyDecor, autoSell, bagBlends, brew, sellCups, cupValue, cupCold, COLD_RATE,
  propCount, teaValue, teaItemValue, isHat, makeRaw, HAT_RATE, RAW_RATE, RAW_DECAY, isFresh, seasonKey, reservationPrice, deliverIdxOf,
  reservedCount, cartSummary,
  create, advance, addLog, slowView, bigView, patternView, compostable, compostItems, autoCompost, COMPOST_Q, TOOLS, canCare, harvestSlot,
  canMoveNow, propGrown, propYearOf, care, careAll, careAllTargets, CARE_SUPPLY, buy, buySupply, SUPPLIES, PETAL_BUY_RATE, PETAL_BUY_Q, petalPrice,
  buyPetal, reserve, plant, propagate, move, makeTea, sellTea,
  guideKeys, guideFill, guideTap, potFlower,
  FARM_GIFT, FARM_GIFT_IDX, FARM_GIFT_FROM, farmGiftId, farmGift, flowerAt, dexCount, DEX_TOTAL, dexTotal, blendKeys, blendNear, blendNearText,
  FLOWER_TASTE, teaTaste, CHAPTERS, QUESTS, TITLES, TITLE_KEYS, EXTRA_TITLE_KEYS, chapterOpen, chapterDone, checkJournal, setTitleOn, TITLE_PERKS,
  TOP_BOOST, titlePerk, PRES_H, PRES_RATE, PRES_MUT_RATE, PRES_TITLE_KEYS, presValue, presName, presFull, presReason, preserve, presTick, presDex,
  presCount, presMutCount, presLeftH, presDexOf, sellPreserved, titlePerkText, topDecoOf, setTopDeco, clearTopDeco, newGardenId, saveSummary,
  SHARE_URL, shareCard, makeSave, parseSave, SAVE_NUMS, cleanSave, SAVE_FORMAT, MIGRATIONS, migrateSave, CLOUD_GAP, cloudDue, cloudAutoOk,
  cloudTokenUse, cloudDecide, freshGarden, freshPick, gardenBorn, firstVisitOf, applyAccount, cloudRewardPlan, giveCloudReward, inAppBrowser,
  outsideUrl, DECOS, DECO_KEYS, EXTRA_DECO_KEYS, MUT_BASE, MUT_SLEEP, MUT_JAR, MUT_MAX, MUT_INHERIT, MUT_SLEEP_KEYS, MUTANTS, MUTANT_KEYS,
  MUT_TITLE_KEYS, mutStage, mutShown, decoKey, mutJarsOf, mutChance, mutRoll, mutSeed, mutSee, mutSync, mutDexCount, mutDexCells, mutDex, jarCapture,
  mutDev, MONTH_DECO_Q, MONTH_DECO_KEYS, monthDecoOf, monthDecoBoost, monthDecoLift, DECO_BUFF, decoActive, decoBuffLine, decoInfo, decoTotal,
  decoCount, decoExtras, decoOffer, decoAt, addDeco, buyDeco, placeDeco, storeDeco, decoMonths, DECO_GROUPS, decoGroupOf, decoMax, decoGroups,
  decoPlaceable, decoEffect, firstFlower, questName, questWhenOf, GIFT_BY_MONTH, giftPot, STARTER_BLEND, starterText, firstGuest, firstGuestReady,
  MAIL_CATS, MAIL_WARN, MAIL_MAX, MAIL_MONEY_MAX, mailMoney, MAIL_LEN, kstDay, mailGiftOk, mailValue, mailCheck, mailFor, mailDeliver, mailOf,
  mailGiftText, mailTake, trimLetterBox, LETTER_BOX_MAX, INBOX_NEWS_MAX, NEWS_MATCH, newsKind, inboxOf, inboxUnread, inboxOpen, MINE_W, MINE_H,
  MINE_MAX_E, MINE_REGEN_H, MINE_DEEPEST, mineMaxE, jewelP, WORKSHOP, WORKSHOP_KEYS, WORKSHOP_BUFF, DECO_REACH, BASIN_H, LAMP_Q, FOSSIL_E, AMBER_P,
  OLDPOT_Q, decoNear, waterSet, lampTick, workshopLock, workshopBuy, JEWEL_P, JEWEL_BASE, JEWEL_STEP, jewelWon, DESCEND_WON, ORES, FOSSILS, ORE_KEYS,
  FOSSIL_KEYS, MINE_DEX_KEYS, mineName, mineOf, mineRegen, dig, descend, mineUp, toDeepest, freshBoard, autoDigWon, AUTO_DIG_WON, AUTO_BUDGETS,
  AUTO_BUDGET, autoKeepE, AUTO_KEEP_E, presDeco, presDecoTick, PRES_DECO_Q, shareAlbum, mineAutoSet, mineAutoView, mineAutoFlush, CRAFTS, CRAFT_KEYS,
  TOOL_CRAFTS, NO_SHOVEL, canCraft, craft, mineCount, GIFTS, GIFT_KEYS, LETTERS, LETTER_KEYS, letterCount, giftsOf, sendGift, deliverLetters,
  letterLeftFor, RETURNS, RETURN_V, RETURN_WHERE, pickReturn, giveReturn, returnValue, returnName, returnText, returnEV, letterOf, MEMENTOS,
  MEMENTO_KEYS, mementoCount, orderText, orderMatch, ORDER_BASE, orderBonus, orderMax, makeOrders, fillOrder, countCup, yearScore, yearLogOf,
  newYearNow, yearMonth, newYearPace, graphAxis, graphYears, yearDiff, yearDiffOf, yearPace, XP, GRADE_TIERS, gradeCost, gradeName, gradeAt, gradeOf,
  addXp, gradeDexSync, gradeView, gradeBadge, gradeAlerts, gradeAwayLine, gradeUpText, gradeUnlockText, isGradeUpLine, gradeXpAt, GRADE_BY,
  GRADE_GROUPS, gradeDexCount, newGrade, WEEKLY, WEEKLY_KEYS, WEEKLY_TIERS, WEEKLY_XP, WEEKLY_BONUS, weeklyText, weeklyRoll, weeklyOf, weekNote,
  weeklyFinish, weeklyView, weeklySnap, weeklyAwayLine, isWeeklyLine, PANTRY_H, pantryH, PANTRY_CYCLE, PANTRY_BASE, PANTRY_PER_DECO, PANTRY_CAPS,
  PANTRY_ITEMS, PANTRY_KEYS, pantryOf, pantryCap, pantryDayValue, pantryTick, GRADE_DECO_KEYS, gradeDecoOffer, HONEY_R, HIVE_MAX, hiveR, hiveMax,
  HONEY_KEYS, honeyName, hiveBlooms, honeyOf, hiveTick, takeHoney, honeyCup, honeyCount, honeyLeft, honeyIn, HONEY_TEA_RATE, HONEY_TEA_WILD,
  honeyTeaName, honeyTeaValue, INSECT_LINE, insectLine, propQuality, barrelTick, AUTO_KEYS, AUTO_Q, placedOf, basketFlowers, basketBlooms,
  basketTick, INSECTS, INSECT_KEYS, INSECT_CARE, insectR, insectFlowers, insectNear, insectsOn, insectCareTick, insectTick, INSECT_SUPPLY,
  INSECT_TOOL, insectCraft, insectDig, insectTake, insectShort, harvestYear, ladybugGift, autoStats, isAutoLine, autoAwayLines, FARM, FARM_KEYS,
  FARM_STATS, farmCounts, farmMark, farmLastOf, farmLine, farmOf, AWAY_LAST_MAX, awayKeep, SHELF_N, TEASTAND_KEEP, rackN, rackTick, autoDryTick,
  BONUS, BONUS_KEYS, BONUS_PER, BONUS_COST, bonusPointsAt, newBonus, bonusMax, bonusLevel, bonusVal, bonusCostTo, BONUS_OLD, bonusOpen, pollenGot,
  POLLEN_WON, P41_LETTER, bonusOwned, bonusPrice, bonusNeed, bonusHas, bonusStepName, bonusOpenedAt, seedQ, seedQAt, SEED_Q0, SEED_Q_STEP,
  seedUpText, bonusOpenText, awayHome, bonusMaxed, bonusSet, bonusView, SPEED_V, catchUpH, CATCHUP_WEEKS, SPEED_STEPS, dryText, timeText, flowLeftH,
  dryRate, dryLeftH, pollenExtra, SEASON_YEARS, SEASON_TITLES, SEASON_KEEP, newSeason, PATHS, PATH_KEYS, PATH_NONE, seasonPath, pathInfo, pathTitle,
  pathBadge, seasonTable, seasonN, seasonRows, seasonReady, seasonCanStart, seasonHint, seasonBadge, seasonBreaks, seasonStart, LAYERS,
  LAYER_MAX_OPEN, newLayers, TREES, TREE_KEYS, FOREST_N, TREE_BIG, TREE_STAGES, newForest, forestOpen, forestTick, plantTree, forestOf, forestCount,
  forestDex, forestBigSlots, forestVisitors, forestGrowDev, layerYears, layerNow, layerOf, layerSync, layerCheck, YEARLY, YEARLY_KEYS, YEARLY_ROWS,
  newYearly, yearlyNo, yearlyOf, yearlyTick, yearlyMark, yearlyNow, yearlyMissedAll, awayLongSnap, awayLines, awayLinesText, AWAY_MISSED_MAX,
  isYearlyMissLine, yearlySeen, yearlyCount, yearlyDex, yearlyPast, VISITORS, VISITOR_KEYS, VISITOR_MAX, VISITOR_P, VISITOR_GIFT_AT, newVisitors,
  visitorOk, visitorCells, visitorTick, visitorsOf, visitorAt, visitorTimes, visitorCall, ORDER_MEMENTO_KEYS, helperKeep, helperTick, autoLineType,
  GEAR, growRate, wallSet, wallBlocks, bloomLeads, bloomLeftFlowH, bloomLeftH, RIPE_H, ripeOn, annualSpanH, pickFlower, DRY_H, BLENDS, BLEND_KEYS,
  BLEND_RATE, RECIPE_RATE, blendRecipe, blendValue, dryPetals, makeTeaDried, blend, sellBlends, bagNeed, blendMax, blendPlan,
};
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Engine = api;
})(typeof window !== 'undefined' ? window : globalThis);
