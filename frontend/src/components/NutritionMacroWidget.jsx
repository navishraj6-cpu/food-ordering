import React, { useState } from "react";
import { calculateCartMacros } from "../utils/nutritionCalculator";

export const NutritionMacroWidget = ({ cartItems = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const macros = calculateCartMacros(cartItems);

  if (cartItems.length === 0) return null;

  // Daily target benchmarks (based on standard 2000 kcal diet)
  const CAL_TARGET = 2000;
  const PRO_TARGET = 75;
  const CARB_TARGET = 250;
  const FAT_TARGET = 65;

  const calPercent = Math.min(100, Math.round((macros.calories / CAL_TARGET) * 100));
  const proPercent = Math.min(100, Math.round((macros.protein / PRO_TARGET) * 100));
  const carbPercent = Math.min(100, Math.round((macros.carbs / CARB_TARGET) * 100));
  const fatPercent = Math.min(100, Math.round((macros.fat / FAT_TARGET) * 100));

  return (
    <div className="macro-widget-container">
      <div
        className="macro-widget-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
      >
        <div className="macro-header-left">
          <span className="macro-icon">⚡</span>
          <div>
            <strong className="macro-title">Smart Nutrition & Macro HUD</strong>
            <span className="macro-subtitle">
              {macros.calories} kcal • {macros.protein}g Protein in Cart
            </span>
          </div>
        </div>
        <button
          className="macro-toggle-btn"
          aria-label={isExpanded ? "Collapse Nutrition" : "Expand Nutrition"}
          type="button"
        >
          {isExpanded ? "▲ Hide" : "▼ Breakdown"}
        </button>
      </div>

      {isExpanded && (
        <div className="macro-details-panel">
          <div className="macro-rings-grid">
            {/* Calories Gauge */}
            <div className="macro-ring-card cal-ring">
              <div className="macro-val-pill">{macros.calories}</div>
              <span className="macro-unit">kcal</span>
              <span className="macro-label">Calories</span>
              <div className="macro-progress-bar">
                <div
                  className="macro-fill cal-fill"
                  style={{ width: `${calPercent}%` }}
                ></div>
              </div>
              <small className="macro-target-hint">{calPercent}% of 2k daily</small>
            </div>

            {/* Protein Gauge */}
            <div className="macro-ring-card pro-ring">
              <div className="macro-val-pill">{macros.protein}g</div>
              <span className="macro-unit">Goal: 75g</span>
              <span className="macro-label">Protein</span>
              <div className="macro-progress-bar">
                <div
                  className="macro-fill pro-fill"
                  style={{ width: `${proPercent}%` }}
                ></div>
              </div>
              <small className="macro-target-hint">{proPercent}% muscle fuel</small>
            </div>

            {/* Carbs Gauge */}
            <div className="macro-ring-card carb-ring">
              <div className="macro-val-pill">{macros.carbs}g</div>
              <span className="macro-unit">Goal: 250g</span>
              <span className="macro-label">Carbs</span>
              <div className="macro-progress-bar">
                <div
                  className="macro-fill carb-fill"
                  style={{ width: `${carbPercent}%` }}
                ></div>
              </div>
              <small className="macro-target-hint">{carbPercent}% energy</small>
            </div>

            {/* Fat Gauge */}
            <div className="macro-ring-card fat-ring">
              <div className="macro-val-pill">{macros.fat}g</div>
              <span className="macro-unit">Goal: 65g</span>
              <span className="macro-label">Healthy Fats</span>
              <div className="macro-progress-bar">
                <div
                  className="macro-fill fat-fill"
                  style={{ width: `${fatPercent}%` }}
                ></div>
              </div>
              <small className="macro-target-hint">{fatPercent}% daily fats</small>
            </div>
          </div>

          <div className="macro-diet-highlights">
            {macros.protein >= 35 && (
              <span className="diet-pill high-protein">💪 High Protein Meal</span>
            )}
            {macros.carbs <= 45 && (
              <span className="diet-pill low-carb">🥗 Low Carb Friendly</span>
            )}
            <span className="diet-pill sodium-info">🧂 Sodium: ~{macros.sodium}mg</span>
            <span className="diet-pill fiber-info">🌾 Fiber: ~{macros.fiber}g</span>
          </div>
        </div>
      )}
    </div>
  );
};
export default NutritionMacroWidget;
