"use client";

import React from "react";
import { ColorPalette } from "../types/color";

interface SavedPalettesProps {
  savedPalettes: ColorPalette[];
  onPaletteSelect: (palette: ColorPalette) => void;
}

export default function SavedPalettes({
  savedPalettes,
  onPaletteSelect,
}: SavedPalettesProps) {
  if (savedPalettes.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 theme-elementary-text">
      <h3 className="text-xl font-semibold theme-text-primary mb-6">
        📚 保存済みパレット
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedPalettes.slice(-6).map((palette) => (
          <div
            key={palette.id}
            className="theme-card rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => onPaletteSelect(palette)}
          >
            <h4 className="font-medium theme-text-primary mb-2">
              {palette.name}
            </h4>
            <div className="flex h-6 rounded overflow-hidden">
              {palette.colors.map((color, index) => (
                <div
                  key={`${palette.id}-color-${index}`}
                  className="flex-1"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
            <p className="text-xs theme-text-muted mt-2">
              {new Date(palette.createdAt).toLocaleDateString("ja-JP")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
