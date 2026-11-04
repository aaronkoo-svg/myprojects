// 쓰는 아이콘만 하나씩 불러와 앱 크기를 줄인다 (전체 묶음을 불러오면 1,500개가 다 들어감)
import type { Icon } from 'phosphor-react-native';

export type { Icon };

// require로 불러오면 라이브러리 원본 코드까지 타입 검사하지 않아도 된다
export const ArrowClockwise: Icon = require('phosphor-react-native/src/icons/ArrowClockwise').ArrowClockwise;
export const BellSimple: Icon = require('phosphor-react-native/src/icons/BellSimple').BellSimple;
export const CalendarBlank: Icon = require('phosphor-react-native/src/icons/CalendarBlank').CalendarBlank;
export const CalendarCheck: Icon = require('phosphor-react-native/src/icons/CalendarCheck').CalendarCheck;
export const CaretDown: Icon = require('phosphor-react-native/src/icons/CaretDown').CaretDown;
export const CaretLeft: Icon = require('phosphor-react-native/src/icons/CaretLeft').CaretLeft;
export const CaretRight: Icon = require('phosphor-react-native/src/icons/CaretRight').CaretRight;
export const Check: Icon = require('phosphor-react-native/src/icons/Check').Check;
export const Compass: Icon = require('phosphor-react-native/src/icons/Compass').Compass;
export const GearSix: Icon = require('phosphor-react-native/src/icons/GearSix').GearSix;
export const Lightbulb: Icon = require('phosphor-react-native/src/icons/Lightbulb').Lightbulb;
export const Mountains: Icon = require('phosphor-react-native/src/icons/Mountains').Mountains;
export const Plus: Icon = require('phosphor-react-native/src/icons/Plus').Plus;
export const SunHorizon: Icon = require('phosphor-react-native/src/icons/SunHorizon').SunHorizon;
export const X: Icon = require('phosphor-react-native/src/icons/X').X;
