const ROWS = 15;
const COLS = 17;
const BASE_BOMBS = 2;
const BASE_RANGE = 2;
const BASE_MOVE_DELAY = 145;
const MAX_LEVEL = 99;
const THEMES = [
  { id: "ocean", name: "深海遺跡", icon: "🌊", fuseMs: 3200, rangeBonus: 1, pierceCrates: false, flameMs: 620 },
  { id: "mine", name: "熔岩礦坑", icon: "⛏", fuseMs: 2600, rangeBonus: 2, pierceCrates: false, flameMs: 700 },
  { id: "space", name: "失重太空站", icon: "✦", fuseMs: 2100, rangeBonus: 0, pierceCrates: true, flameMs: 520 },
  { id: "volcano", name: "火山核心", icon: "☄", fuseMs: 1800, rangeBonus: 2, pierceCrates: false, flameMs: 850 },
  { id: "ice", name: "極光冰原", icon: "❄", fuseMs: 3400, rangeBonus: 1, pierceCrates: false, flameMs: 500 },
  { id: "jungle", name: "遠古叢林", icon: "❋", fuseMs: 2800, rangeBonus: 0, pierceCrates: true, flameMs: 680 },
  { id: "cyber", name: "霓虹都市", icon: "⌘", fuseMs: 1900, rangeBonus: 1, pierceCrates: false, flameMs: 600 },
  { id: "ruins", name: "沙海神殿", icon: "◇", fuseMs: 3000, rangeBonus: 2, pierceCrates: false, flameMs: 720 },
  { id: "nebula", name: "星雲幻境", icon: "☼", fuseMs: 2300, rangeBonus: 1, pierceCrates: true, flameMs: 560 },
  { id: "crystal", name: "水晶深淵", icon: "◆", fuseMs: 2500, rangeBonus: 2, pierceCrates: true, flameMs: 780 },
];
const BOMB_TYPES = [
  { id: "normal", label: "標準炸彈", unlockLevel: 1, asset: "bomb.svg", rangeBonus: 0, powerup: null },
  { id: "fire", label: "烈焰炸彈", unlockLevel: 3, asset: "bomb-fire.svg", rangeBonus: 1, powerup: "bombFire" },
  { id: "pierce", label: "穿透炸彈", unlockLevel: 6, asset: "bomb-pierce.svg", rangeBonus: 0, powerup: "bombPierce" },
  { id: "remote", label: "遙控炸彈", unlockLevel: 10, asset: "bomb-remote.svg", rangeBonus: 0, powerup: "bombRemote" },
];
const MOUNT_TYPES = [
  { id: "leap", label: "跳躍型", powerup: "mountLeap", asset: "assets/mounted-player.svg" },
  { id: "throw", label: "投擲型", powerup: "mountThrow", asset: "assets/mounted-player-throw.svg" },
  { id: "shield", label: "護盾型", powerup: "mountShield", asset: "assets/mounted-player-shield.svg" },
];
const DIRECTIONS = [
  { row: -1, col: 0, name: "up" },
  { row: 1, col: 0, name: "down" },
  { row: 0, col: -1, name: "left" },
  { row: 0, col: 1, name: "right" },
];
const START = { row: 1, col: 1 };
const EXIT = { row: ROWS - 2, col: COLS - 2 };
const ENEMY_STARTS = [
  { row: 1, col: COLS - 2 },
  { row: ROWS - 2, col: 1 },
  { row: ROWS - 3, col: COLS - 2 },
];
const INITIAL_POWERUPS = [
  { row: 1, col: 2, type: "bombCapacity" },
  { row: 2, col: 1, type: "range" },
  { row: 5, col: 7, type: "speed" },
  { row: 9, col: 10, type: "shield" },
];
const MOUNT_POWERUP_SPOTS = [{ row: 3, col: 1 }, { row: 1, col: 3 }];
const POWERUP_ASSETS = {
  bombCapacity: { src: "assets/power-bomb.svg", label: "炸彈數量強化" },
  range: { src: "assets/power-flame.svg", label: "爆風範圍強化" },
  speed: { src: "assets/power-speed.svg", label: "移動速度強化" },
  shield: { src: "assets/power-shield.svg", label: "護盾" },
  mountLeap: { src: "assets/power-mount.svg", label: "跳躍型坐騎" },
  mountThrow: { src: "assets/power-mount-throw.svg", label: "投擲型坐騎" },
  mountShield: { src: "assets/power-mount-shield.svg", label: "護盾型坐騎" },
  bombFire: { src: "assets/bomb-fire.svg", label: "烈焰炸彈" },
  bombPierce: { src: "assets/bomb-pierce.svg", label: "穿透炸彈" },
  bombRemote: { src: "assets/bomb-remote.svg", label: "遙控炸彈" },
};

const boardElement = document.querySelector("#board");
const livesElement = document.querySelector("#lives");
const scoreElement = document.querySelector("#score");
const killsElement = document.querySelector("#kills");
const upgradesElement = document.querySelector("#upgrades");
const bombStockElement = document.querySelector("#bomb-stock");
const bombButton = document.querySelector("#bomb-button");
const mountActions = document.querySelector("#mount-actions");
const jumpButton = document.querySelector("#jump-button");
const switchMountButton = document.querySelector("#switch-mount-button");
const remoteButton = document.querySelector("#remote-button");
const statusMessageElement = document.querySelector("#status-message");
const toastElement = document.querySelector("#toast");
const helpDialog = document.querySelector("#help-dialog");
boardElement.style.setProperty("--cols", COLS);
boardElement.style.setProperty("--rows", ROWS);

let terrain;
let player;
let enemies;
let boss;
let bombs;
let flames;
let powerups;
let lives;
let score;
let kills;
let range;
let maxBombs;
let moveDelay;
let shields;
let upgrades;
let level;
let facing;
let mounted;
let mountType;
let ownedMounts;
let bombType;
let collectedItems;
let pendingThrowBombId;
let nextBombId;
let invulnerableUntil;
let lastMoveAt;
let lastEnemyMoveAt;
let gameState;
let heldDirection;
let toastTimeout;

function createTerrain(currentLevel = 1) {
  const cells = Array.from({ length: ROWS }, () => Array(COLS).fill("floor"));
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (row === 0 || col === 0 || row === ROWS - 1 || col === COLS - 1) {
        cells[row][col] = "wall";
      } else if (row % 2 === 0 && col % 2 === 0) {
        cells[row][col] = "wall";
      }
    }
  }

  const safeSpots = [START, EXIT, ...ENEMY_STARTS];
  for (const powerup of INITIAL_POWERUPS) safeSpots.push(powerup);
  safeSpots.push(...MOUNT_POWERUP_SPOTS);
  for (let row = 1; row < ROWS - 1; row += 1) {
    for (let col = 1; col < COLS - 1; col += 1) {
      if (cells[row][col] !== "floor") continue;
      const protectedCell = safeSpots.some((spot) =>
        Math.abs(spot.row - row) + Math.abs(spot.col - col) <= 1);
      if (protectedCell) continue;
      const density = Math.min(8, 5 + Math.floor((currentLevel - 1) / 20));
      const crateSeed = (row * 17 + col * 13 + row * col * 7 + currentLevel * 19) % 11;
      if (crateSeed < density) cells[row][col] = "crate";
    }
  }
  return cells;
}

function getTheme(currentLevel = level) {
  return THEMES[Math.floor((currentLevel - 1) / 10) % THEMES.length];
}

function isBossLevel(currentLevel = level) {
  return currentLevel % 10 === 0;
}

function themeBombSummary(theme = getTheme()) {
  const range = theme.rangeBonus > 0 ? `範圍 +${theme.rangeBonus}` : "標準範圍";
  const pierce = theme.pierceCrates ? "可穿透木箱" : "木箱阻擋爆風";
  return `引爆 ${theme.fuseMs / 1000} 秒・${range}・${pierce}`;
}

function keyOf(row, col) {
  return `${row},${col}`;
}

function isInside(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function entityAt(entities, row, col) {
  return entities.find((entity) => entity.row === row && entity.col === col);
}

function addSprite(parent, src, className, label) {
  const image = document.createElement("img");
  image.className = className;
  image.src = src;
  image.alt = label;
  image.draggable = false;
  parent.append(image);
}

function showStatus(message, type = "") {
  statusMessageElement.className = `status-message${type ? ` ${type}` : ""}`;
  statusMessageElement.replaceChildren();
  const icon = document.createElement("span");
  icon.className = "status-icon";
  icon.textContent = type === "success" ? "✓" : type === "danger" ? "!" : "✳";
  const text = document.createElement("span");
  text.textContent = message;
  statusMessageElement.append(icon, text);
}

function renderBoard() {
  const now = Date.now();
  const theme = getTheme();
  boardElement.dataset.theme = theme.id;
  boardElement.setAttribute("aria-label", `${theme.name}第 ${level} 關競技場`);
  boardElement.replaceChildren();
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = document.createElement("div");
      const terrainType = terrain[row][col];
      const key = keyOf(row, col);
      cell.className = `cell ${terrainType}-cell`;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", terrainType === "wall" ? "鋼牆" : terrainType === "crate" ? "木箱" : "地面");

      if (row === EXIT.row && col === EXIT.col) {
        const exitOpen = enemies.length === 0 && !boss;
        cell.classList.add("exit-cell", exitOpen ? "exit-open" : "exit-locked");
        cell.setAttribute("aria-label", exitOpen ? "已開啟出口" : "被封鎖的出口");
        const exitMark = document.createElement("span");
        exitMark.className = "exit-mark";
        exitMark.textContent = exitOpen ? "↗" : "▣";
        cell.append(exitMark);
      }

      if (flames.has(key)) {
        cell.classList.add("flame-cell");
        const flame = document.createElement("span");
        flame.className = "flame-icon";
        flame.textContent = "✹";
        cell.append(flame);
        cell.setAttribute("aria-label", "爆炸火焰");
      } else if (entityAt(bombs, row, col)) {
        const bomb = entityAt(bombs, row, col);
        const bombData = BOMB_TYPES.find((item) => item.id === bomb.type);
        cell.classList.add("bomb-cell");
        addSprite(cell, `assets/${bombData.asset}`, `tile-sprite bomb-icon bomb-${bomb.type}`, bombData.label);
        cell.setAttribute("aria-label", "炸彈");
      } else if (entityAt(powerups, row, col)) {
        const powerup = entityAt(powerups, row, col);
        const asset = POWERUP_ASSETS[powerup.type];
        cell.classList.add("power-cell");
        addSprite(cell, asset.src, "tile-sprite power-icon", asset.label);
        cell.setAttribute("aria-label", asset.label);
      }

      const playerHere = player.row === row && player.col === col;
      if (playerHere) {
        cell.classList.add("player-cell");
        if (now < invulnerableUntil) cell.classList.add("invulnerable");
        cell.setAttribute("aria-label", "玩家");
        const activeMount = MOUNT_TYPES.find((item) => item.id === mountType);
        addSprite(cell, mounted && activeMount ? activeMount.asset : "assets/player.svg", "tile-sprite player-icon", mounted ? `${activeMount.label}坐騎上的玩家` : "玩家機器人");
      } else if (entityAt(enemies, row, col)) {
        cell.classList.add("enemy-cell");
        cell.setAttribute("aria-label", "追擊機器人");
        addSprite(cell, "assets/enemy.svg", "tile-sprite enemy-icon", "追擊機器人");
      } else if (boss && boss.row === row && boss.col === col) {
        cell.classList.add("boss-cell");
        cell.setAttribute("aria-label", `區域首領，生命 ${boss.health}`);
        addSprite(cell, "assets/boss.svg", "tile-sprite boss-icon", `${theme.name}首領`);
      }
      boardElement.append(cell);
    }
  }
}

function renderHud() {
  const theme = getTheme();
  document.querySelector("#level-number").textContent = String(level).padStart(2, "0");
  document.querySelector("#level-caption").textContent = `${theme.icon} ${theme.name} · 第 ${String(level).padStart(2, "0")} / ${MAX_LEVEL} 關`;
  document.querySelector("#arena-title").textContent = `${theme.name}競技場`;
  const pendingBomb = bombs.find((bomb) => bomb.id === pendingThrowBombId);
  const canThrow = mounted && mountType === "throw" && pendingBomb;
  mountActions.hidden = ownedMounts.length === 0;
  jumpButton.hidden = !mounted || mountType !== "leap";
  jumpButton.disabled = gameState !== "playing";
  switchMountButton.textContent = mounted ? `換騎 · ${MOUNT_TYPES.find((item) => item.id === mountType).label}` : "上騎坐騎";
  switchMountButton.disabled = gameState !== "playing" || ownedMounts.length === 0;
  remoteButton.hidden = !bombs.some((bomb) => bomb.type === "remote");
  const equippedBomb = BOMB_TYPES.find((type) => type.id === bombType);
  bombButton.querySelector(".bomb-emoji").src = `assets/${equippedBomb.asset}`;
  bombButton.querySelector("span").textContent = canThrow ? "投擲炸彈" : bombType === "remote" ? "放遙控彈" : "放炸彈";
  bombButton.setAttribute("aria-label", canThrow ? "投擲已放置炸彈" : "放置炸彈");
  bombButton.title = `${themeBombSummary(theme)}${equippedBomb.id === "pierce" && !theme.pierceCrates ? "；穿透炸彈可穿透木箱" : ""}`;
  document.querySelector("#bomb-caption").textContent = canThrow
    ? "再次按下，沿面向方向投擲"
    : `${equippedBomb.label} · ${theme.fuseMs / 1000}s · 範圍+${theme.rangeBonus}${theme.pierceCrates || equippedBomb.id === "pierce" ? " · 穿透" : ""}`;
  const bossStatus = boss ? ` · 首領 ${boss.health}/${boss.maxHealth}` : "";
  document.querySelector("#enemy-progress").textContent = enemies.length === 0 && !boss
    ? "出口已開啟"
    : `${boss ? "追兵 " : ""}${enemies.length}${bossStatus}`;
  document.querySelector("#enemy-progress").classList.toggle("exit-ready", enemies.length === 0 && !boss);
  livesElement.textContent = Array.from({ length: 3 }, (_, index) => index < lives ? "♥" : "♡").join(" ");
  livesElement.setAttribute("aria-label", `${lives} 條生命`);
  scoreElement.textContent = String(score).padStart(4, "0");
  killsElement.textContent = String(kills);
  upgradesElement.textContent = String(upgrades);
  document.querySelector("#bombs-available").textContent = `${maxBombs - bombs.length} / ${maxBombs}`;
  document.querySelector("#shield-count").textContent = String(shields);
  bombButton.disabled = gameState !== "playing" || (!canThrow && bombs.length >= maxBombs);
}

function render() {
  renderBoard();
  renderHud();
}

function updateTip() {
  const title = document.querySelector("#tip-title");
  const copy = document.querySelector("#level-tip");
  if (mounted) {
    const activeMount = MOUNT_TYPES.find((item) => item.id === mountType);
    title.textContent = `${activeMount.label}已上陣`;
    copy.textContent = mountType === "leap"
      ? "按「跳躍」跨過面前的木箱或炸彈；坐騎可抵擋一次炸彈爆風。使用「換騎」切換其他已收集坐騎。"
      : mountType === "throw"
        ? "放置炸彈後再次按炸彈按鈕，沿目前面向投擲並跨越木箱；坐騎可抵擋一次炸彈爆風。"
        : "護盾型坐騎可抵擋一次炸彈爆風或敵人碰撞；使用「換騎」切換其他已收集坐騎。";
  } else if (level >= 2) {
    title.textContent = "坐騎補給";
    copy.textContent = "尋找不同坐騎並用「上騎坐騎」或「換騎」切換；各自提供跳躍、投擲或護盾能力。";
  } else {
    title.textContent = "競技場補給";
    copy.textContent = "擊退所有追兵後前往出口。拾取道具可升級；死亡時會隨機掉落一項已收集的強化。";
  }
}

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toastElement.classList.remove("visible"), 1800);
}

function canMoveTo(row, col) {
  return isInside(row, col)
    && terrain[row][col] === "floor"
    && !entityAt(bombs, row, col);
}

function addCollectedItem(type) {
  collectedItems.push(type);
  const mount = MOUNT_TYPES.find((item) => item.powerup === type);
  if (mount) {
    if (!ownedMounts.includes(mount.id)) ownedMounts.push(mount.id);
    mounted = true;
    mountType = mount.id;
  } else if (type === "range") {
    range = Math.min(range + 1, 6);
  } else if (type === "bombCapacity") {
    maxBombs = Math.min(maxBombs + 1, 5);
  } else if (type === "speed") {
    moveDelay = Math.max(moveDelay - 22, 75);
  } else if (type === "shield") {
    shields += 1;
  } else {
    const bomb = BOMB_TYPES.find((item) => item.powerup === type);
    if (bomb) bombType = bomb.id;
  }
}

function switchMount() {
  if (gameState !== "playing" || ownedMounts.length === 0) return;
  const currentIndex = mounted ? ownedMounts.indexOf(mountType) : -1;
  mountType = ownedMounts[(currentIndex + 1) % ownedMounts.length];
  mounted = true;
  updateTip();
  showStatus(`${MOUNT_TYPES.find((item) => item.id === mountType).label}坐騎已上陣。`, "success");
  render();
}

function collectPowerupAt(row, col) {
  const powerupIndex = powerups.findIndex((item) => item.row === row && item.col === col);
  if (powerupIndex === -1) return false;
  const [powerup] = powerups.splice(powerupIndex, 1);
  addCollectedItem(powerup.type);
  updateTip();
  showStatus(`${POWERUP_ASSETS[powerup.type].label}已取得！`, "success");
  showToast(`${POWERUP_ASSETS[powerup.type].label}已收集`);
  score += 50;
  upgrades += 1;
  return true;
}

function undoCollectedItem(type) {
  const mount = MOUNT_TYPES.find((item) => item.powerup === type);
  if (mount) {
    if (!collectedItems.includes(type)) {
      ownedMounts = ownedMounts.filter((item) => item !== mount.id);
      if (mountType === mount.id) {
        mounted = false;
        mountType = null;
      }
    }
    return;
  }
  if (type === "range") range = Math.max(BASE_RANGE, range - 1);
  else if (type === "bombCapacity") maxBombs = Math.max(BASE_BOMBS, maxBombs - 1);
  else if (type === "speed") moveDelay = Math.min(BASE_MOVE_DELAY, moveDelay + 22);
  else if (type === "shield") shields = Math.max(0, shields - 1);
  else {
    const currentBomb = BOMB_TYPES.find((item) => item.id === bombType);
    if (currentBomb?.powerup === type) {
      const lastBombPowerup = [...collectedItems].reverse().find((item) =>
        BOMB_TYPES.some((candidate) => candidate.powerup === item));
      bombType = BOMB_TYPES.find((item) => item.powerup === lastBombPowerup)?.id ?? "normal";
    }
  }
}

function dropRandomCollectedItem(row, col) {
  if (collectedItems.length === 0) return;
  const index = Math.floor(Math.random() * collectedItems.length);
  const [type] = collectedItems.splice(index, 1);
  undoCollectedItem(type);
  const positions = [{ row, col }];
  const visited = new Set([keyOf(row, col)]);
  for (let cursor = 0; cursor < positions.length; cursor += 1) {
    const current = positions[cursor];
    if (terrain[current.row][current.col] === "floor"
      && !entityAt(powerups, current.row, current.col)
      && !entityAt(bombs, current.row, current.col)
      && !(current.row === EXIT.row && current.col === EXIT.col)) {
      powerups.push({ ...current, type });
      showToast(`死亡掉落：${POWERUP_ASSETS[type].label}`);
      return;
    }
    for (const direction of DIRECTIONS) {
      const next = { row: current.row + direction.row, col: current.col + direction.col };
      const key = keyOf(next.row, next.col);
      if (isInside(next.row, next.col) && !visited.has(key)) {
        visited.add(key);
        positions.push(next);
      }
    }
  }
}

function consumeMount() {
  const powerup = MOUNT_TYPES.find((item) => item.id === mountType)?.powerup;
  if (powerup) {
    const index = collectedItems.indexOf(powerup);
    if (index >= 0) collectedItems.splice(index, 1);
    if (collectedItems.includes(powerup)) {
      mounted = false;
      mountType = null;
      updateTip();
      return;
    }
  }
  ownedMounts = ownedMounts.filter((item) => item !== mountType);
  mounted = false;
  mountType = null;
  updateTip();
}

function movePlayer(directionName) {
  if (gameState !== "playing") return;
  facing = directionName;
  const direction = DIRECTIONS.find((item) => item.name === directionName);
  const row = player.row + direction.row;
  const col = player.col + direction.col;
  if (!canMoveTo(row, col)) return;
  player.row = row;
  player.col = col;
  if (flames.has(keyOf(row, col))) {
    hitPlayer("blast");
    return;
  }

  collectPowerupAt(row, col);
  if (entityAt(enemies, row, col) || (boss && boss.row === row && boss.col === col)) {
    hitPlayer("enemy");
    return;
  }
  checkExit(row, col);
  render();
}

function checkExit(row, col) {
  if (row !== EXIT.row || col !== EXIT.col) return;
  if (enemies.length > 0 || boss) {
    showStatus(boss ? `擊敗區域首領才能開啟出口！剩餘生命 ${boss.health}。` : `出口仍被 ${enemies.length} 個追兵封鎖！`, "danger");
    return;
  }
  advanceLevel();
}

function placeOrThrowBomb() {
  const pendingBomb = bombs.find((bomb) => bomb.id === pendingThrowBombId);
  if (mounted && mountType === "throw" && pendingBomb) {
    throwBomb(pendingBomb);
    return;
  }
  placeBomb();
}

function placeBomb() {
  if (gameState !== "playing" || bombs.length >= maxBombs) return;
  if (entityAt(bombs, player.row, player.col)) return;
  const type = BOMB_TYPES.find((item) => item.id === bombType);
  const bomb = {
    id: nextBombId++,
    row: player.row,
    col: player.col,
    explodeAt: type.id === "remote" ? null : Date.now() + getTheme().fuseMs,
    range: Math.min(range + type.rangeBonus + getTheme().rangeBonus, 8),
    type: type.id,
    pierceCrates: type.id === "pierce" || getTheme().pierceCrates,
    themeId: getTheme().id,
  };
  bombs.push(bomb);
  pendingThrowBombId = bomb.id;
  showStatus(type.id === "remote" ? "遙控炸彈已放置，按下引爆按鈕啟動！" : `${type.label}已放置！`, "danger");
  render();
}

function throwBomb(bomb) {
  if (!mounted || mountType !== "throw" || gameState !== "playing") return;
  const direction = DIRECTIONS.find((item) => item.name === facing);
  let destination = { row: bomb.row, col: bomb.col };
  let moved = false;
  for (let step = 1; step <= 3; step += 1) {
    const row = bomb.row + direction.row * step;
    const col = bomb.col + direction.col * step;
    if (!isInside(row, col) || terrain[row][col] === "wall" || entityAt(bombs, row, col)) break;
    if (terrain[row][col] === "crate") continue;
    destination = { row, col };
    moved = true;
  }
  if (!moved) {
    showToast("前方沒有可投擲的位置");
    return;
  }
  bomb.row = destination.row;
  bomb.col = destination.col;
  bomb.thrown = true;
  pendingThrowBombId = null;
  showStatus("已將炸彈沿目前方向投擲！", "danger");
  render();
}

function jump() {
  if (!mounted || mountType !== "leap" || gameState !== "playing") return;
  const direction = DIRECTIONS.find((item) => item.name === facing);
  const overRow = player.row + direction.row;
  const overCol = player.col + direction.col;
  const landRow = player.row + direction.row * 2;
  const landCol = player.col + direction.col * 2;
  const obstacle = isInside(overRow, overCol)
    && (terrain[overRow][overCol] === "crate" || entityAt(bombs, overRow, overCol));
  if (!obstacle || !isInside(landRow, landCol) || terrain[landRow][landCol] !== "floor" || entityAt(bombs, landRow, landCol)) {
    showToast("面前需要有障礙才能跳躍");
    return;
  }
  player.row = landRow;
  player.col = landCol;
  collectPowerupAt(landRow, landCol);
  if (flames.has(keyOf(landRow, landCol))
    || entityAt(enemies, landRow, landCol)
    || (boss && boss.row === landRow && boss.col === landCol)) {
    hitPlayer(flames.has(keyOf(landRow, landCol)) ? "blast" : "enemy");
    return;
  }
  checkExit(landRow, landCol);
  if (gameState !== "playing") return;
  showStatus("跳躍成功，越過障礙！", "success");
  showToast("跳躍成功！");
  render();
}

function detonateRemoteBombs() {
  if (gameState !== "playing") return;
  const remotes = bombs.filter((bomb) => bomb.type === "remote");
  if (remotes.length === 0) return;
  for (const bomb of remotes) {
    if (entityAt(bombs, bomb.row, bomb.col)) explodeBomb(bomb);
  }
  render();
}

function hitPlayer(source = "enemy") {
  if (gameState !== "playing" || Date.now() < invulnerableUntil) return;
  if (mounted && (source === "blast" || mountType === "shield")) {
    consumeMount();
    invulnerableUntil = Date.now() + 1400;
    player = { ...START };
    heldDirection = null;
    showStatus("坐騎替你擋下攻擊並消失了！", "success");
    showToast("坐騎已消耗");
    render();
    return;
  }
  if (shields > 0) {
    shields -= 1;
    invulnerableUntil = Date.now() + 1400;
    player = { ...START };
    heldDirection = null;
    showStatus("護盾擋下攻擊！短暫無敵中。", "success");
    showToast("護盾已消耗");
    render();
    return;
  }
  const deathPosition = { ...player };
  lives -= 1;
  dropRandomCollectedItem(deathPosition.row, deathPosition.col);
  updateTip();
  invulnerableUntil = Date.now() + 1400;
  if (lives <= 0) {
    endGame("lost");
    return;
  }
  player = { ...START };
  heldDirection = null;
  showStatus("受到攻擊！短暫無敵中，快離開出生點。", "danger");
  showToast(`剩下 ${lives} 條生命`);
  render();
}

function explodeBomb(initialBomb) {
  const queue = [initialBomb];
  const exploded = new Set();
  const blastCells = new Set();

  while (queue.length > 0) {
    const bomb = queue.shift();
    const bombKey = keyOf(bomb.row, bomb.col);
    if (exploded.has(bombKey)) continue;
    exploded.add(bombKey);
    bombs = bombs.filter((item) => keyOf(item.row, item.col) !== bombKey);
    if (pendingThrowBombId === bomb.id) pendingThrowBombId = null;
    blastCells.add(bombKey);
    if (terrain[bomb.row][bomb.col] === "crate") {
      terrain[bomb.row][bomb.col] = "floor";
      score += 10;
    }

    for (const direction of DIRECTIONS) {
      for (let step = 1; step <= bomb.range; step += 1) {
        const row = bomb.row + direction.row * step;
        const col = bomb.col + direction.col * step;
        if (!isInside(row, col) || terrain[row][col] === "wall") break;
        const key = keyOf(row, col);
        blastCells.add(key);

        const chainedBomb = entityAt(bombs, row, col);
        if (chainedBomb) queue.push(chainedBomb);

        if (terrain[row][col] === "crate") {
          terrain[row][col] = "floor";
          score += 10;
          if (Math.random() < 0.3) {
            const availableTypes = Object.keys(POWERUP_ASSETS).filter((type) => {
              const bomb = BOMB_TYPES.find((item) => item.powerup === type);
              const mount = MOUNT_TYPES.find((item) => item.powerup === type);
              return (!bomb || level >= bomb.unlockLevel) && (!mount || level >=
                (mount.id === "leap" ? 2 : mount.id === "throw" ? 5 : 8));
            });
            if (!entityAt(powerups, row, col)) {
              powerups.push({ row, col, type: availableTypes[Math.floor(Math.random() * availableTypes.length)] });
            }
          }
          if (!bomb.pierceCrates) break;
        }
      }
    }
  }

  const expiresAt = Date.now() + getTheme().flameMs;
  for (const key of blastCells) flames.set(key, expiresAt);
  score += 5 * blastCells.size;
  enemies = enemies.filter((enemy) => {
    if (!blastCells.has(keyOf(enemy.row, enemy.col))) return true;
    kills += 1;
    score += 100;
    showToast("追擊機器人已擊退 +100");
    return false;
  });
  let bossDefeated = false;
  if (boss && blastCells.has(keyOf(boss.row, boss.col))) {
    boss.health -= 1;
    if (boss.health <= 0) {
      score += 1000;
      kills += 1;
      bossDefeated = true;
      showToast("首領擊敗 +1000");
      boss = null;
    } else {
      showStatus(`首領受到爆炸傷害，剩餘 ${boss.health}/${boss.maxHealth} 生命！`, "danger");
      showToast(`首領生命 ${boss.health}/${boss.maxHealth}`);
    }
  }
  if (bossDefeated) showStatus(`${getTheme().name}首領已擊敗！${enemies.length === 0 ? "出口開啟。" : "清除剩餘追兵以開啟出口。"}`, "success");
  else if (boss) showStatus(`爆炸！首領生命 ${boss.health}/${boss.maxHealth}。`, "danger");
  else if (enemies.length === 0) showStatus("威脅已清除！出口已開啟。", "success");
  else showStatus("爆炸！爆風會被鋼牆擋下。", "danger");
  if (blastCells.has(keyOf(player.row, player.col))) hitPlayer("blast");
}

function moveEnemies(now) {
  const enemyMoveDelay = Math.max(220, 520 - Math.floor((level - 1) / 5) * 16);
  if (now - lastEnemyMoveAt < enemyMoveDelay) return;
  lastEnemyMoveAt = now;
  for (const enemy of [...enemies]) {
    const options = DIRECTIONS
      .map((direction) => ({ row: enemy.row + direction.row, col: enemy.col + direction.col }))
      .filter(({ row, col }) => canMoveTo(row, col)
        && !entityAt(enemies, row, col)
        && !(boss && boss.row === row && boss.col === col)
        && !entityAt(powerups, row, col));
    if (options.length === 0) continue;

    const closerOptions = options.filter((option) =>
      Math.abs(option.row - player.row) + Math.abs(option.col - player.col)
      < Math.abs(enemy.row - player.row) + Math.abs(enemy.col - player.col));
    const choices = closerOptions.length > 0 && Math.random() < 0.82 ? closerOptions : options;
    const next = choices[Math.floor(Math.random() * choices.length)];
    enemy.row = next.row;
    enemy.col = next.col;
    if (flames.has(keyOf(enemy.row, enemy.col))) {
      enemies = enemies.filter((item) => item !== enemy);
      kills += 1;
      score += 100;
      showToast("追擊機器人已擊退 +100");
      continue;
    }
    if (enemy.row === player.row && enemy.col === player.col) hitPlayer();
  }
  render();
}

function spawnEnemies(currentLevel) {
  const count = Math.min(
    6 + Math.floor((currentLevel - 1) / 4) + (isBossLevel(currentLevel) ? 2 : 0),
    28,
  );
  const candidates = [];
  for (let row = 1; row < ROWS - 1; row += 1) {
    for (let col = 1; col < COLS - 1; col += 1) {
      if (terrain[row][col] !== "floor") continue;
      if (row === EXIT.row && col === EXIT.col) continue;
      if (Math.abs(row - START.row) + Math.abs(col - START.col) < 6) continue;
      if (entityAt(powerups, row, col) || (boss && boss.row === row && boss.col === col)) continue;
      candidates.push({ row, col });
    }
  }
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
  }
  return candidates.slice(0, Math.min(count, candidates.length));
}

function spawnBoss(currentLevel) {
  if (!isBossLevel(currentLevel)) return null;
  const candidates = [];
  for (let row = 1; row < ROWS - 1; row += 1) {
    for (let col = 1; col < COLS - 1; col += 1) {
      if (terrain[row][col] !== "floor" || entityAt(powerups, row, col)) continue;
      if (Math.abs(row - START.row) + Math.abs(col - START.col) < 10) continue;
      if (row === EXIT.row && col === EXIT.col) continue;
      candidates.push({ row, col });
    }
  }
  candidates.sort((a, b) =>
    (Math.abs(b.row - START.row) + Math.abs(b.col - START.col))
    - (Math.abs(a.row - START.row) + Math.abs(a.col - START.col)));
  const position = candidates[0];
  if (!position) throw new Error(`Unable to place boss on level ${currentLevel}`);
  const health = Math.min(3 + Math.floor(currentLevel / 30), 6);
  return { ...position, health, maxHealth: health, lastMoveAt: Date.now() };
}

function moveBoss(now) {
  if (!boss || now - boss.lastMoveAt < 720) return;
  boss.lastMoveAt = now;
  const options = DIRECTIONS
    .map((direction) => ({ row: boss.row + direction.row, col: boss.col + direction.col }))
    .filter(({ row, col }) => canMoveTo(row, col)
      && !entityAt(enemies, row, col)
      && !entityAt(powerups, row, col)
      && !flames.has(keyOf(row, col)));
  if (options.length === 0) return;
  options.sort((a, b) =>
    (Math.abs(a.row - player.row) + Math.abs(a.col - player.col))
    - (Math.abs(b.row - player.row) + Math.abs(b.col - player.col)));
  const next = options[Math.random() < 0.85 ? 0 : Math.floor(Math.random() * options.length)];
  boss.row = next.row;
  boss.col = next.col;
  if (boss.row === player.row && boss.col === player.col) hitPlayer("enemy");
}

function beginLevel(nextLevel, announce = true) {
  level = nextLevel;
  terrain = createTerrain(level);
  player = { ...START };
  facing = "right";
  enemies = [];
  boss = null;
  bombs = [];
  pendingThrowBombId = null;
  flames = new Map();
  powerups = INITIAL_POWERUPS.map((powerup) => ({ ...powerup }));
  if (level >= 2) {
    powerups[0] = { ...powerups[0], type: ownedMounts.includes("leap") ? "bombCapacity" : "mountLeap" };
  }
  if (level >= 5 && !ownedMounts.includes("throw")) powerups.push({ ...MOUNT_POWERUP_SPOTS[0], type: "mountThrow" });
  if (level >= 8 && !ownedMounts.includes("shield")) powerups.push({ ...MOUNT_POWERUP_SPOTS[1], type: "mountShield" });
  boss = spawnBoss(level);
  enemies = spawnEnemies(level);
  lastEnemyMoveAt = Date.now();
  updateTip();
  if (announce) {
    const theme = getTheme();
    const newBomb = BOMB_TYPES.find((type) => type.unlockLevel === level);
    const message = boss
      ? `首領戰！第 ${level} 關「${theme.name}」首領登場，生命 ${boss.health}${newBomb ? `；可拾取${newBomb.label}` : ""}。炸彈特性：${themeBombSummary(theme)}`
      : newBomb
        ? `第 ${level} 關進入「${theme.name}」！可拾取${newBomb.label}；本區域炸彈：${themeBombSummary(theme)}`
        : level === 2
          ? "第 2 關！跳躍型坐騎登場，擊退追兵後前往出口。"
          : `第 ${level} 關：${theme.name}。本區域炸彈：${themeBombSummary(theme)}`;
    showStatus(message, "success");
    showToast(message);
  }
  render();
}

function advanceLevel() {
  if (level >= MAX_LEVEL) {
    endGame("won");
    return;
  }
  const nextLevel = level + 1;
  if (lives < 3) lives += 1;
  beginLevel(nextLevel);
}

function endGame(result) {
  gameState = result;
  heldDirection = null;
  if (result === "won") {
    showStatus(`恭喜通關 ${MAX_LEVEL} 關！總分 ${score}。`, "success");
    showToast("99 關全數制霸！");
  } else {
    showStatus(`生存結束，得分 ${score}。按「重新開始」再挑戰！`, "danger");
    showToast("再試一次，你可以的！");
  }
  render();
}

function tick() {
  if (gameState !== "playing") return;
  const now = Date.now();
  let worldChanged = false;

  if (heldDirection && now - lastMoveAt >= moveDelay) {
    movePlayer(heldDirection);
    lastMoveAt = now;
  }

  const expiredBombs = bombs.filter((bomb) => bomb.explodeAt !== null && now >= bomb.explodeAt);
  for (const bomb of expiredBombs) {
    if (entityAt(bombs, bomb.row, bomb.col)) {
      explodeBomb(bomb);
      worldChanged = true;
    }
  }
  if (gameState !== "playing") return;
  for (const [key, expiresAt] of flames) {
    if (now >= expiresAt) {
      flames.delete(key);
      worldChanged = true;
    }
  }

  moveEnemies(now);
  moveBoss(now);
  if (gameState !== "playing") return;
  if (worldChanged) render();
  else renderHud();
}

function resetGame() {
  level = 1;
  mounted = false;
  mountType = null;
  ownedMounts = [];
  collectedItems = [];
  facing = "right";
  bombs = [];
  pendingThrowBombId = null;
  nextBombId = 1;
  lives = 3;
  score = 0;
  kills = 0;
  range = BASE_RANGE;
  maxBombs = BASE_BOMBS;
  moveDelay = BASE_MOVE_DELAY;
  shields = 0;
  upgrades = 0;
  invulnerableUntil = 0;
  lastMoveAt = 0;
  heldDirection = null;
  bombType = "normal";
  gameState = "playing";
  beginLevel(1, false);
  showStatus("用方向鍵移動，放下炸彈清出道路！");
}

function startDirection(event) {
  if (event.cancelable) event.preventDefault();
  const button = event.currentTarget;
  heldDirection = button.dataset.direction;
  button.classList.add("pressed");
  movePlayer(heldDirection);
  lastMoveAt = Date.now();
  if (event.pointerId !== undefined && button.setPointerCapture) button.setPointerCapture(event.pointerId);
}

function stopDirection(event) {
  const button = event.currentTarget;
  button.classList.remove("pressed");
  heldDirection = null;
}

document.querySelectorAll(".dpad-button").forEach((button) => {
  button.addEventListener("pointerdown", startDirection);
  button.addEventListener("pointerup", stopDirection);
  button.addEventListener("pointercancel", stopDirection);
  button.addEventListener("lostpointercapture", stopDirection);
});

bombButton.addEventListener("click", placeOrThrowBomb);
jumpButton.addEventListener("click", jump);
switchMountButton.addEventListener("click", switchMount);
remoteButton.addEventListener("click", detonateRemoteBombs);
document.querySelector("#restart-button").addEventListener("click", resetGame);
document.querySelector("#help-button").addEventListener("click", () => helpDialog.showModal());
document.querySelector("#close-help").addEventListener("click", () => helpDialog.close());
document.querySelector("#help-ok").addEventListener("click", () => helpDialog.close());

document.addEventListener("pointerup", () => {
  heldDirection = null;
  document.querySelectorAll(".dpad-button.pressed").forEach((button) => button.classList.remove("pressed"));
});

document.addEventListener("keydown", (event) => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLSelectElement) return;
  const keyDirections = {
    ArrowUp: "up", KeyW: "up",
    ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
  };
  if (keyDirections[event.code]) {
    event.preventDefault();
    heldDirection = keyDirections[event.code];
    movePlayer(heldDirection);
    lastMoveAt = Date.now();
  } else if (event.code === "Space") {
    event.preventDefault();
    placeOrThrowBomb();
  } else if (event.code === "KeyX") {
    event.preventDefault();
    jump();
  } else if (event.code === "KeyC") {
    event.preventDefault();
    switchMount();
  } else if (event.code === "KeyR") {
    event.preventDefault();
    detonateRemoteBombs();
  }
});

document.addEventListener("keyup", (event) => {
  const keyDirections = {
    ArrowUp: "up", KeyW: "up",
    ArrowDown: "down", KeyS: "down",
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
  };
  if (keyDirections[event.code] === heldDirection) heldDirection = null;
});

resetGame();
window.setInterval(tick, 80);
