import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import DashboardView from "./DashboardView";
import JournalView from "./JournalView";
import LearnView from "./LearnView";
import LogForm from "./LogForm";
import PlansView from "./PlansView";
import ProfileView from "./ProfileView";
import ReflectForm from "./ReflectForm";
import TrainView from "./TrainView";

const screens = [
  ["DashboardView", DashboardView],
  ["LogForm", LogForm],
  ["ReflectForm", ReflectForm],
  ["JournalView", JournalView],
  ["TrainView", TrainView],
  ["LearnView", LearnView],
  ["PlansView", PlansView],
  ["ProfileView", ProfileView],
] as const;

describe("app screens", () => {
  it.each(screens)("%s renders without throwing", (_name, Screen) => {
    expect(() => renderToString(<Screen />)).not.toThrow();
  });
});
