import * as THREE from 'three'
import { Curves } from 'three/examples/jsm/curves/CurveExtras'
import { addEffect } from 'react-three-fiber'
import create from 'zustand'
import * as audio from './audio'

let guid = 1

const [useStore, api] = create((set, get) => {
  let spline = new Curves.GrannyKnot()
  let track = new THREE.TubeBufferGeometry(spline, 250, 0.2, 10, true)
  let cancelLaserTO = undefined
  let cancelExplosionTO = undefined
  const box = new THREE.Box3()

  return {
    sound: false,
    camera: undefined,
    points: 0,
    health: 100,
    lasers: [],
    explosions: [],
    rocks: randomData(100, track, 150, 8, () => 1 + Math.random() * 2.5),
    enemies: randomData(10, track, 20, 15, 1),

    mutation: {
      t: 0,
      position: new THREE.Vector3(),
      startTime: Date.now(),

      track,
      scale: 15,
      fov: 70,
      hits: false,
      rings: randomRings(30, track),
      particles: randomData(1500, track, 100, 1, () => 0.5 + Math.random() * 0.8),
      looptime: 40 * 1000,
      binormal: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      clock: new THREE.Clock(false),
      mouse: new THREE.Vector2(-250, 50),

      // Re-usable objects
      dummy: new THREE.Object3D(),
      ray: new THREE.Ray(),
      box: new THREE.Box3()
    },

    actions: {
      init(camera) {
        const { mutation, actions } = get()

        set({ camera })
        mutation.clock.start()
        actions.toggleSound(get().sound)

        addEffect(() => {
          const { rocks, enemies } = get()

          const time = Date.now()
          const t = (mutation.t = ((time - mutation.startTime) % mutation.looptime) / mutation.looptime)
          mutation.position = track.parameters.path.getPointAt(t)
          mutation.position.multiplyScalar(mutation.scale)

          // test for wormhole/warp
          let warping = false
          if (t > 0.3 && t < 0.4) {
            if (!warping) {
              warping = true
              playAudio(audio.warp)
            }
          } else if (t > 0.5) warping = false

          // test for hits
          const r = rocks.filter(actions.test)
          const e = enemies.filter(actions.test)
          const a = r.concat(e)
          const previous = mutation.hits
          mutation.hits = a.length
          if (previous === 0 && mutation.hits) playAudio(audio.click)
          const lasers = get().lasers
          if (mutation.hits && lasers.length && time - lasers[lasers.length - 1] < 100) {
            const updates = a.map((data) => ({ time: Date.now(), ...data }))
            set((state) => ({ explosions: [...state.explosions, ...updates] }))
            clearTimeout(cancelExplosionTO)
            cancelExplosionTO = setTimeout(() => set((state) => ({ explosions: state.explosions.filter(({ time }) => Date.now() - time <= 1000) })), 1000)
            set((state) => ({
              points: state.points + r.length * 100 + e.length * 200,
              rocks: state.rocks.filter((rock) => !r.find((r) => r.guid === rock.guid)),
              enemies: state.enemies.filter((enemy) => !e.find((e) => e.guid === enemy.guid))
            }))
          }
          //if (a.some(data => data.distance < 15)) set(state => ({ health: state.health - 1 }))
        })
      },
      shoot() {
        set((state) => ({ lasers: [...state.lasers, Date.now()] }))
        clearTimeout(cancelLaserTO)
        cancelLaserTO = setTimeout(() => set((state) => ({ lasers: state.lasers.filter((t) => Date.now() - t <= 1000) })), 1000)
        playAudio(audio.zap, 0.5)
      },
      initializePS4ControllerSupport() {
        function Fire_The_Cannons() {
          set((state) => ({ lasers: [...state.lasers, Date.now()] }))
          clearTimeout(cancelLaserTO)
          cancelLaserTO = setTimeout(() => set((state) => ({ lasers: state.lasers.filter((t) => Date.now() - t <= 1000) })), 1000)
          playAudio(audio.zap, 0.5)
        }

        // enable gamepad controller support
        var haveEvents = 'ongamepadconnected' in window
        var controllers = {}
        var stickyJoystickHelper = 0.07 // make this number higher to reduce the effect of sticky joysticks
        var x = 0
        var y = 0
        var sign = 1 // this is 1 for windows, -1 for iphone, it's because iphone axis goes 1 to -1 up to down
        // while windows goes -1 to 1 up to down
        // PS4WebAxisMap_iPhone
        var PS4WebAxisMap_Windows = {
          0: 'LStickLR',
          1: 'LStickUD',
          2: 'RStickLR',
          3: 'RStickUD'
        }

        var PS4WebAxisMap_iPhone = {
          0: 'LStickLR',
          1: 'LStickUD',
          2: 'RStickLR',
          3: 'RStickUD',
          4: 'dPadLR',
          5: 'dPadUD'
        }

        var PS4WebAxisValues = {
          0: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        }

        // iPhone buttons only read up to [0:7] while windows reads all [0:17]
        var PS4WebButtonMap = {
          0: 'X',
          1: 'Circle',
          2: 'Square',
          3: 'Triangle',
          4: 'L1',
          5: 'R1',
          6: 'L2',
          7: 'R2',
          8: 'SHARE',
          9: 'OPTIONS',
          10: 'L3',
          11: 'R3',
          12: 'Up',
          13: 'Down',
          14: 'Left',
          15: 'Right',
          16: 'PS',
          17: 'DragPad'
        }

        // these correspond to the ps4 web button map and are true if the button
        // is being pressed, and false when not.
        var PS4WebButtonsPressed = {
          X: false,
          Circle: false,
          Square: false,
          Triangle: false,
          L1: false,
          R1: false,
          L2: false,
          R2: false,
          SHARE: false,
          OPTIONS: false,
          L3: false,
          R3: false,
          Up: false,
          Down: false,
          Left: false,
          Right: false,
          PS: false,
          DragPad: false
        }

        // if multiple gamepads are connected to a computer, this gets called
        function connecthandler(e) {
          // e comes from window event triggering argument
          // event listener for when a certain button is pressed
          addgamepad(e.gamepad) // e.gamepad is of high importance
        }

        // call this to add a newly connected gamepad's own button divs and spans and progresses for each button or axes that's detected
        // this is only called once each time a new gamepad is added
        function addgamepad(gamepad) {
          controllers[gamepad.index] = gamepad // save gamepad to the controllers dictionary(python)
          // var d = document.createElement("div"); // create a new section
          // d.setAttribute("id", "controller" + gamepad.index); // update the div's id="controller#"

          // append the main <div id="controller#"> tag and all the sub tags to the doc body
          // document.body.appendChild(d);
          // d.style.display = "none";
          // requestAnimationFrame(updateStatus); // this updates about every 20ms...too fast
          setInterval(updateStatus, 50) // check the update status every 50 ms. Perfect!
        }

        // this is the function that is being listed for by the window and that gets called after a gamepad
        // was disconnected -- start removing a gamepad from the html body
        function disconnecthandler(e) {
          removegamepad(e.gamepad)
        }

        // we can select the controller/element by it's id that was set earlier
        // and remove it which removes all the tags for its buttons and axes.
        function removegamepad(gamepad) {
          // var d = document.getElementById("controller" + gamepad.index);
          // document.body.removeChild(d);
          delete controllers[gamepad.index] // this removes the controller's existance from the dictionary
        }

        // This gets called repeatedly to check which buttons are being pressed
        // and how what directions/how far the axis controls are being pressed.
        function updateStatus() {
          // if not 'ongamepadconnected' in window, if no gamepad is connected, scan for gamepads
          if (!haveEvents) {
            scangamepads()
          }
          var i = 0
          var j
          // if a gamepad is connected:
          // for every j controller navigator.getGamepads()[i] in controllers dictionary
          for (j in controllers) {
            var controller = controllers[j]
            // d = document.getElementById("controller" + j); // get the right controller element from the dict
            // htmlButtons = d.getElementsByClassName("button"); // get a list of all the button elements for the controller
            // aButtonWasPressed = false // reset each time
            // check the following for the number of buttons the controller has
            for (i = 0; i < controller.buttons.length; i++) {
              var controllerButtonObj = controller.buttons[i] // get the controller's i'th button object
              var btnPressed = controllerButtonObj.pressed //val is the controller button: pressed: T/F
              // var btnValue = controllerButtonObj.value // value comes from the val object. val is the number returned by the controller button
              // I will keep an array of the buttons that
              // btnPressedOrReleased = "pressed";
              // if (btnPressed == true) {
              //   aButtonWasPressed = true
              // }
              // I would like to be able to enable autofire
              // for a certain amount of time with a cooldown
              // or reload timeout
              // Enable auto fire: keep the cannons firing
              // while R2 is being held down
              if (btnPressed === true && PS4WebButtonMap[i] === 'R2' && PS4WebButtonsPressed['R2'] === true) {
                Fire_The_Cannons()
              }

              // I need to know which button was pressed
              if (btnPressed === true && PS4WebButtonsPressed[PS4WebButtonMap[i]] === false) {
                // if a released button was pressed
                PS4WebButtonsPressed[PS4WebButtonMap[i]] = true // do nothing if there was no change
                // singlefire with R1
                if (PS4WebButtonMap[i] === 'R1') {
                  Fire_The_Cannons()
                }
              } else if (btnPressed === false && PS4WebButtonsPressed[PS4WebButtonMap[i]] === true) {
                // btnPressedOrReleased = "released";
                PS4WebButtonsPressed[PS4WebButtonMap[i]] = false
              }
            }
            // run through every axis in the controller
            for (i = 0; i < controller.axes.length; i++) {
              // I would like to fly around on the screen
              // with the left joystick,
              // iPhone ps4 stick values go from -1 to 1 when the
              // stick goes from left to right and down to up
              // Windows axis values change from -1 to 1 when stick goes from left to right, up to down
              // mouse.set(0, 0) is the center of the screen
              // the screen width is supposed to be window.innerWidth
              // this only updates with a new axis value when a significant change occurs (>0.04)
              if (Math.abs(PS4WebAxisValues[i] - controller.axes[i]) >= 0.01) {
                PS4WebAxisValues[i] = controller.axes[i].toFixed(2) // from -1 to 1
                // if the joystick is almost 0, make it 0. So there is no unwanted phantom movement from the stick
                if (Math.abs(PS4WebAxisValues[i]) <= stickyJoystickHelper) {
                  PS4WebAxisValues[i] = 0
                }
                // update the new x and y for the ship only if a sizeable change in position occurred
                if (PS4WebAxisMap[i] === 'LStickLR') {
                  x = PS4WebAxisValues[i] * window.innerWidth * 0.5
                } else if (PS4WebAxisMap[i] === 'LStickUD') {
                  y = PS4WebAxisValues[i] * window.innerHeight * sign * 0.5
                }
                get().mutation.mouse.set(x, y) // update where the game thinks the mouse is so the ship moves there
              }
            }
          }
        }

        // check the navigator for gamepads
        function scangamepads() {
          var gamepads = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []
          // for each gamepad that was found
          for (var i = 0; i < gamepads.length; i++) {
            // check to see if the i'th gamepads has something
            if (gamepads[i]) {
              // if the i'th gamepads index is in the controllers dict
              if (gamepads[i].index in controllers) {
                // update the controllers dictionary to the navigator gamepad's state (which updates which buttons/axes are being pressed)
                controllers[gamepads[i].index] = gamepads[i]
              } else {
                // otherwise, this is a new gamepad, so add it
                addgamepad(gamepads[i])
              }
            }
          }
        }
        // the window is listening for gamepads connecting to the website/pc. If found, trigger connecthandler() function with window as first argument
        window.addEventListener('gamepadconnected', connecthandler)
        window.addEventListener('gamepaddisconnected', disconnecthandler) // also listen for when the gamepad is disconnected
        // Every 0.5sec, call scangamepads()
        // if not 'ongamepadconnected' in window, scan for gamepads again in 500ms
        // The following isn't needed with the window event listener for "gamepadconnected"
        // If I only want to scan for gamepad button changes every n ms, I can use
        // the following rather than rely on hte event listener for button changes (faster)
        // if (!haveEvents) {
        //     setInterval(scangamepads, 500);
        // }
        // Current deviceType's are "iPhone", "Windows", "Linux"
        // The following checks if I'm using an iphone or pc,
        // which I need since the button mapping is extra wack between them rn
        // var deviceType = ''
        var PS4WebAxisMap = {}
        var ua = window.navigator.userAgent
        if (ua.indexOf('iPhone') !== -1 && ua.indexOf('Safari') !== -1) {
          // deviceType = 'iPhone'
          sign = -1
          PS4WebAxisMap = PS4WebAxisMap_iPhone
        } else if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Windows') !== -1) {
          // deviceType = 'Windows'
          sign = 1
          PS4WebAxisMap = PS4WebAxisMap_Windows
        } else if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Linux') !== -1) {
          // deviceType = 'Linux'
          sign = 1
          PS4WebAxisMap = PS4WebAxisMap_Windows
        } else {
          // deviceType = 'Unknown'
          sign = 1
          PS4WebAxisMap = PS4WebAxisMap_Windows
        }
      },
      toggleSound(sound = !get().sound) {
        set({ sound })
        playAudio(audio.engine, 1, true)
        playAudio(audio.engine2, 0.3, true)
        playAudio(audio.bg, 1, true)
      },
      updateMouse({ clientX: x, clientY: y }) {
        get().mutation.mouse.set(x - window.innerWidth / 2, y - window.innerHeight / 2)
      },
      test(data) {
        box.min.copy(data.offset)
        box.max.copy(data.offset)
        box.expandByScalar(data.size * data.scale)
        data.hit.set(10000, 10000, 10000)
        const result = get().mutation.ray.intersectBox(box, data.hit)
        data.distance = get().mutation.ray.origin.distanceTo(data.hit)
        return result
      }
    }
  }
})

function randomData(count, track, radius, size, scale) {
  return new Array(count).fill().map(() => {
    const t = Math.random()
    const pos = track.parameters.path.getPointAt(t)
    pos.multiplyScalar(15)
    const offset = pos
      .clone()
      .add(new THREE.Vector3(-radius + Math.random() * radius * 2, -radius + Math.random() * radius * 2, -radius + Math.random() * radius * 2))
    const speed = 0.1 + Math.random()
    return { guid: guid++, scale: typeof scale === 'function' ? scale() : scale, size, offset, pos, speed, radius, t, hit: new THREE.Vector3(), distance: 1000 }
  })
}

function randomRings(count, track) {
  let temp = []
  let t = 0.4
  for (let i = 0; i < count; i++) {
    t += 0.003
    const pos = track.parameters.path.getPointAt(t)
    pos.multiplyScalar(15)
    const segments = track.tangents.length
    const pickt = t * segments
    const pick = Math.floor(pickt)
    const lookAt = track.parameters.path.getPointAt((t + 1 / track.parameters.path.getLength()) % 1).multiplyScalar(15)
    const matrix = new THREE.Matrix4().lookAt(pos, lookAt, track.binormals[pick])
    temp.push([pos.toArray(), matrix])
  }
  return temp
}

function playAudio(audio, volume = 1, loop = false) {
  if (api.getState().sound) {
    audio.currentTime = 0
    audio.volume = Math.max(volume, 1)
    audio.loop = loop
    audio.play()
  } else audio.pause()
}

export default useStore
export { audio, playAudio }
