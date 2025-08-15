/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

// Original: 2022-04-05T09:02:24+02:00 by Hendrik G. Seliger (github@hseliger.eu)
// Forked and enhanced: 2024 by Muhammed Hussien (muhammed.hussien2030@gmail.com)

// Based on the initial version by ickyicky (https://github.com/ickyicky),
// extended by a few methods to provide the focused window's title, window class, and pid.

// Updated to use ECMA Script Module (ESM) for Gnome 45
// See: https://gjs.guide/extensions/upgrading/gnome-shell-45.html

/* exported init */

import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import GLib from 'gi://GLib';

const MR_DBUS_IFACE = `
<node>
    <interface name="org.gnome.Shell.Extensions.WindowMonitorPro">
        <method name="List">
            <arg type="s" direction="out" name="win"/>
        </method>
        <method name="FocusTitle">
            <arg type="s" direction="out" />
        </method>
        <method name="FocusPID">
            <arg type="s" direction="out" />
        </method>
        <method name="FocusID">
            <arg type="s" direction="out" />
        </method>
        <method name="FocusClass">
            <arg type="s" direction="out" />
        </method>
        <signal name="WindowFocusChanged">
            <arg type="s" name="window_id"/>
            <arg type="s" name="window_title"/>
            <arg type="s" name="window_class"/>
            <arg type="s" name="window_pid"/>
        </signal>
    </interface>
</node>`;

export default class WCExtension {
    enable() {
        this._dbus = Gio.DBusExportedObject.wrapJSObject(MR_DBUS_IFACE, this);
        this._dbus.export(Gio.DBus.session, '/org/gnome/Shell/Extensions/WindowMonitorPro');
        
        // Connect to window manager signals
        this._connectSignals();
    }

    disable() {
        this._disconnectSignals();
        this._dbus.flush();
        this._dbus.unexport();
        delete this._dbus;
    }

    _connectSignals() {
        // Connect to focus window changes - this is the proper way!
        this._focusChangedId = global.display.connect('notify::focus-window', 
            this._onFocusChanged.bind(this));
    }

    _disconnectSignals() {
        if (this._focusChangedId) {
            global.display.disconnect(this._focusChangedId);
            this._focusChangedId = null;
        }
    }

    _onFocusChanged() {
        // Focus window changed - emit signal immediately
        this._emitFocusChanged();
    }
    
    _emitFocusChanged() {
        const focusedWindow = global.display.get_focus_window();
        
        if (focusedWindow) {
            const windowData = {
                window_id: focusedWindow.get_id().toString(),
                window_title: focusedWindow.get_title() || '',
                window_class: focusedWindow.get_wm_class() || '',
                window_pid: focusedWindow.get_pid().toString()
            };
            
            this._dbus.emit_signal('WindowFocusChanged', 
                new GLib.Variant('(ssss)', [
                    windowData.window_id,
                    windowData.window_title,
                    windowData.window_class,
                    windowData.window_pid
                ]));
        } else {
            // No focused window (empty desktop)
            this._dbus.emit_signal('WindowFocusChanged', 
                new GLib.Variant('(ssss)', [
                    '0',
                    'Desktop',
                    'Desktop',
                    '0'
                ]));
        }
    }
    



    List() {
        let win = global.get_window_actors()
            .map(a => a.meta_window)
            .map(w => ({ class: w.get_wm_class(), pid: w.get_pid(), id: w.get_id(), maximized: w.get_maximized(), focus: w.has_focus(), title: w.get_title() }));
        return JSON.stringify(win);
    }
    FocusTitle() {
        let win = global.get_window_actors()
            .map(a => a.meta_window)
            .map(w => ({ focus: w.has_focus(), title: w.get_title() }));
        for (let [_ignore, aWindow] of win.entries()) {
            let [focus, theTitle] = Object.entries(aWindow);
            if (focus[1] == true)
                return theTitle[1];
        }
        return "";
    }
    FocusPID() {
        let win = global.get_window_actors()
            .map(a => a.meta_window)
            .map(w => ({ focus: w.has_focus(), pid: w.get_pid() }));
        for (let [_ignore, aWindow] of win.entries()) {
            let [focus, thePID] = Object.entries(aWindow);
            if (focus[1] == true)
                return "" + thePID[1]; // Turn number into string
        }
        return "";
    }
    FocusID() {
        let win = global.get_window_actors()
            .map(a => a.meta_window)
            .map(w => ({ focus: w.has_focus(), id: w.get_id() }));
        for (let [_ignore, aWindow] of win.entries()) {
            let [focus, theID] = Object.entries(aWindow);
            if (focus[1] == true)
                return "" + theID[1]; // Turn number into string
        }
        return "";
    }
    FocusClass() {
        let win = global.get_window_actors()
            .map(a => a.meta_window)
            .map(w => ({ focus: w.has_focus(), class: w.get_wm_class() }));
        for (let [_ignore, aWindow] of win.entries()) {
            let [focus, theClass] = Object.entries(aWindow);
            if (focus[1] == true)
                return theClass[1];
        }
        return "";
    }
}
