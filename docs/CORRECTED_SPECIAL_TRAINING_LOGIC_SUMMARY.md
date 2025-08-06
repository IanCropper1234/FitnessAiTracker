# 修正後的特殊訓練方法負荷調整邏輯總結

## 已實施的修正 (2025-08-06)

### 1. **MyoRep Match** (`myorep_match`)
- **Volume Increase**: `specialConfig.targetReps` +1 (無上限，使用用戶設定值)
- **Volume Decrease**: `specialConfig.targetReps` -1 (無下限，使用用戶設定值)
- **Volume Maintain**: 無變化

### 2. **MyoRep No Match** (`myorep_no_match`)
- **Volume Increase**: `specialConfig.targetReps` +1 (無上限，使用用戶設定值)
- **Volume Decrease**: `specialConfig.targetReps` -1 (無下限，使用用戶設定值)
- **Volume Maintain**: 無變化

### 3. **Drop Set** (`drop_set`)
- **Volume Increase**: `specialConfig.targetRepsPerDrop` +1 (無上限，使用用戶設定值)
- **Volume Decrease**: `specialConfig.targetRepsPerDrop` -1 (無下限，使用用戶設定值)
- **Volume Maintain**: 無變化

### 4. **Giant Set** (`giant_set`)
- **Volume Increase**: `specialConfig.totalTargetReps` +5 (無上限，使用用戶設定值)
- **Volume Decrease**: `specialConfig.totalTargetReps` -5 (無下限，使用用戶設定值)
- **Volume Maintain**: 無變化

### 5. **Superset** (`superset`)
- **所有情況**: 無調整（Superset 參數在所有量級變化中都保持不變）

## 核心原則

1. **使用用戶設定值**: 不再使用硬編碼預設值，只調整用戶在訓練課程中實際設定的數值
2. **移除所有限制**: 完全移除上限和下限限制，允許無限調整
3. **精確參數修改**: 調整專屬於每個特殊訓練方法的特定參數
4. **主要練習參數不變**: 練習的基本 `target_reps` 保持原有設定

## 關鍵代碼變更

```typescript
// 修正前 - 使用預設值和限制
const currentSpecialReps = newConfig.targetReps || 15;
newConfig.targetReps = Math.max(8, currentSpecialReps - 1);

// 修正後 - 使用用戶設定值，無限制
const currentSpecialReps = newConfig.targetReps;
if (currentSpecialReps !== undefined && currentSpecialReps !== null) {
  newConfig.targetReps = currentSpecialReps - 1;
}
```

## 驗證方法

特殊訓練方法負荷調整應該在週數推進時正確應用到 `specialConfig` 內的相應參數，不影響主要練習的 `target_reps` 設定。