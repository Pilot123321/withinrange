import WidgetKit
import SwiftUI

// A small home-screen widget for withinrange. Widgets can't scan Bluetooth, so
// this shows *status* the app last published to the shared App Group: whether
// you're visible and roughly how many people were open nearby. Tapping opens
// the app to refresh live.

enum Shared {
  static let appGroup = "group.com.withinrange.app"
}

struct NearbyEntry: TimelineEntry {
  let date: Date
  let open: Bool
  let count: Int
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> NearbyEntry {
    NearbyEntry(date: Date(), open: true, count: 3)
  }

  func getSnapshot(in context: Context, completion: @escaping (NearbyEntry) -> Void) {
    completion(load())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<NearbyEntry>) -> Void) {
    // Status data is pushed by the app; refresh occasionally as a fallback.
    let entry = load()
    let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
    completion(Timeline(entries: [entry], policy: .after(next)))
  }

  private func load() -> NearbyEntry {
    let defaults = UserDefaults(suiteName: Shared.appGroup)
    let open = defaults?.bool(forKey: "open") ?? false
    let count = defaults?.integer(forKey: "nearbyCount") ?? 0
    return NearbyEntry(date: Date(), open: open, count: count)
  }
}

struct WithinrangeWidgetView: View {
  var entry: Provider.Entry

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text("withinrange")
        .font(.caption2.weight(.semibold))
        .foregroundStyle(.secondary)
      Spacer(minLength: 0)
      if entry.open {
        Text("\(entry.count)")
          .font(.system(size: 44, weight: .bold, design: .rounded))
          .foregroundStyle(Color(red: 1.0, green: 0.353, blue: 0.373))
        Text(entry.count == 1 ? "person nearby" : "people nearby")
          .font(.footnote)
          .foregroundStyle(.secondary)
      } else {
        Image(systemName: "eye.slash.fill").foregroundStyle(.secondary)
        Text("Hidden").font(.title2.weight(.bold))
        Text("Tap to go visible").font(.footnote).foregroundStyle(.secondary)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .containerBackground(.fill.tertiary, for: .widget)
  }
}

@main
struct WithinrangeWidget: Widget {
  let kind = "WithinrangeWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      WithinrangeWidgetView(entry: entry)
    }
    .configurationDisplayName("Nearby")
    .description("See if you're visible and how many people are open around you.")
    .supportedFamilies([.systemSmall])
  }
}
