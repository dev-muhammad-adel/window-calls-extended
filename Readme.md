# Window Monitor Pro

This extension is based on the "Window Calls" extension by ickyicky (https://github.com/ickyicky), extended by a few methods to provide the focused window's title, window class, and pid.

This extension allows you to list current windows with some of their properties from command line, super useful for Wayland to get current focused window. The additional information on focused window are also for use with Wayland and espanso (https://github.com/federico-terzi/espanso), which – hopefully – jointly with this extension will be able to provide app-specific keyboard expansions.

**NEW: Signal Support** - The extension now supports D-Bus signals, allowing other applications to receive real-time notifications of window changes without polling!

Credit to [dceee](https://github.com/dceee) for providing example code in [this discussion](https://gist.github.com/rbreaves/257c3edfa301786e66e964d7ac036269).

## ATTENTION
This version has been updated to the new import methods for Gnome 45. So my assumption is it will not work anymore with older Gnome versions (but having upgrade to 45, I cannot test it anymore). So in case you want to use for an older Gnome, pull version 4 of this extension from Github.

## Installation

Install extension from [gnome extensions page](https://extensions.gnome.org/extension/4974/window-calls-extended/).

To manually install, copy `extension.js` and `metadata.json` into a folder by (exactly!! Gnome will not load the extension if the folder name does not match the uuid from the metadata) name of `window-monitor-pro@muhammed.hussien2030.gmail.com` under your `~/.local/share/gnome-shell/extensions` folder.

## Usage

### Methods (Polling)

To get all active windows simply run from terminal:

```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowMonitorPro --method org.gnome.Shell.Extensions.WindowMonitorPro.List
```

To get the title of the window with focus:
```sh
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/WindowMonitorPro --method org.gnome.Shell.Extensions.WindowMonitorPro.FocusTitle
```

Available methods are:
* org.gnome.Shell.Extensions.WindowMonitorPro.List
* org.gnome.Shell.Extensions.WindowMonitorPro.FocusTitle
* org.gnome.Shell.Extensions.WindowMonitorPro.FocusPID
* org.gnome.Shell.Extensions.WindowMonitorPro.FocusID
* org.gnome.Shell.Extensions.WindowMonitorPro.FocusClass

### Signals (No Polling Required!)

The extension now emits D-Bus signals for real-time window events:

#### Available Signals:
- **WindowFocusChanged** - Emitted when window focus changes

#### Signal Parameters:
- `WindowFocusChanged`: window_id, window_title, window_class, window_pid

### Example Clients

#### Python Example
```python
import dbus
import dbus.mainloop.glib
from gi.repository import GLib

# Connect to signals
bus = dbus.SessionBus()
proxy = bus.get_object('org.gnome.Shell', 
                      '/org/gnome/Shell/Extensions/WindowMonitorPro')

proxy.connect_to_signal('WindowFocusChanged', 
    lambda wid, title, cls, pid: print(f"Focus: {title}"))

# Start listening
loop = GLib.MainLoop()
loop.run()
```

#### Node.js Example
```javascript
const dbus = require('dbus-next');

async function listenToSignals() {
    const bus = dbus.sessionBus();
    const proxy = await bus.getProxyObject('org.gnome.Shell', 
                                         '/org/gnome/Shell/Extensions/WindowMonitorPro');
    
    const iface = proxy.getInterface('org.gnome.Shell.Extensions.WindowMonitorPro');
    
    iface.on('WindowFocusChanged', (wid, title, cls, pid) => {
        console.log(`Focus changed to: ${title}`);
    });
}

listenToSignals();
```

#### Bash Example
```bash
#!/bin/bash
# Monitor signals using gdbus
gdbus monitor --session --dest org.gnome.Shell | while read -r line; do
    if echo "$line" | grep -q "WindowFocusChanged"; then
        echo "Focus changed!"
    fi
done
```

### Using from C++
If using from C++, it requires the dbus-1 library. Parameters for the call to `dbus_message_new_method_call` would be
```
#define DB_INTERFACE    "org.gnome.Shell.Extensions.WindowMonitorPro"
#define DB_DESTINATION  "org.gnome.Shell"
#define DB_PATH         "/org/gnome/Shell/Extensions/WindowMonitorPro"
#define DB_METHOD       "List"
```

For signals, you can use `dbus_bus_add_match` to listen for specific signals:

```c
// Listen for focus changes
dbus_bus_add_match(conn, 
    "type='signal',interface='org.gnome.Shell.Extensions.WindowMonitorPro',member='WindowFocusChanged'",
    NULL);
```

## Benefits of Signals vs Polling

- **Real-time updates**: Get notified immediately when changes occur
- **Lower resource usage**: No need to constantly check for changes
- **Better performance**: Reduces CPU usage and battery drain
- **More responsive**: Applications can react instantly to window changes
- **Event-driven**: Cleaner, more maintainable code architecture

## Recent Changes (v9)

- Updated to use proper DBus interface name `WindowMonitorPro`
- Fixed signal emission for window focus changes
- Improved error handling for desktop focus (no focused window)
- Enhanced window data collection with proper null checks
- Updated for GNOME 45+ compatibility with ESM imports
