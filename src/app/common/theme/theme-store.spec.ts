import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY, ThemeStore } from './theme-store';

describe('ThemeStore', () => {
  let document: Document;
  let themeColor: HTMLMetaElement;

  beforeEach(() => {
    document = TestBed.inject(DOCUMENT);
    themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    document.head.appendChild(themeColor);
  });

  afterEach(() => {
    themeColor.remove();
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  it('takes the theme the page loaded with', () => {
    // index.html's script runs first and sets the class
    document.documentElement.classList.add('dark');

    const store = TestBed.inject(ThemeStore);
    TestBed.tick();

    expect(store.dark()).toBe(true);
  });

  it('switches the page, stores the choice and recolours the browser UI', () => {
    const store = TestBed.inject(ThemeStore);
    TestBed.tick();

    store.toggle();

    expect(store.dark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(themeColor.content).toBe('#0b1613');

    store.toggle();

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(themeColor.content).toBe('#f4f5f7');
  });
});
