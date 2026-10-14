import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MenuButtonComponent } from './menu-button.component';

describe('MenuButtonComponent', () => {
  let fixture: ComponentFixture<MenuButtonComponent>;
  let emitted: boolean[];

  beforeEach(async () => {
    fixture = TestBed.createComponent(MenuButtonComponent);
    fixture.componentRef.setInput('menuCollapsed', true);
    emitted = [];
    fixture.componentInstance.menuCollapsedChange.subscribe(collapsed => emitted.push(collapsed));
    await fixture.whenStable();
  });

  const button = (): HTMLButtonElement => fixture.nativeElement.querySelector('button');
  const iconPath = (): string | null => button().querySelector('path')!.getAttribute('d');

  it('shows the hamburger icon while collapsed', () => {
    expect(iconPath()).toContain('M3.75 6.75');
  });

  // The icon follows the input: the parent's `[(menuCollapsed)]` feeds the emitted state back
  it('emits the toggled state on every click', async () => {
    button().click();
    await fixture.whenStable();
    button().click();
    await fixture.whenStable();

    expect(emitted).toEqual([false, true]);
  });

  it('follows the input when the parent changes it', async () => {
    fixture.componentRef.setInput('menuCollapsed', false);
    await fixture.whenStable();

    expect(iconPath()).toBe('M6 18L18 6M6 6l12 12');
  });
});
