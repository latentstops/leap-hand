(function () {

    var LeapHand = {};

    window.LeapHand = LeapHand;

})();


(function () {

    var FingerJoint = function () {

        this.init();

    };

    FingerJoint.prototype.init = function () {

        this.params = { radius: 6 };

        this.create();

    };

    FingerJoint.prototype.create = function () {

        this.createTHREE();
        this.createCANNON();

    };

    FingerJoint.prototype.createTHREE = function () {

        var radius = this.params.radius;

        var handJointMesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius),
            new THREE.MeshPhongMaterial()
        );

        handJointMesh.material.color.setHex(0x008800);

        this.three = handJointMesh;

    };

    FingerJoint.prototype.createCANNON = function () {

        var radius = this.params.radius;

        var handJointShape = new CANNON.Sphere(radius);
        var handJointBody = new CANNON.Body({mass: 1, material: new CANNON.Material()});
            handJointBody.addShape(handJointShape);

        this.cannon = handJointBody;

    };

    FingerJoint.prototype.update = function () {

        this.three.position.copy(this.cannon.position);
        this.three.quaternion.copy(this.cannon.quaternion);

    };

    LeapHand.FingerJoint = FingerJoint;

})();



(function () {

    var FingerBone = function (leapBone) {

        this.init(leapBone);

    };

    FingerBone.prototype.init = function (leapBone) {

        this.leapBone = leapBone;

        this.params = { radiusTop: 5, radiusBottom: 5, numSegments: 10 };

        this.create();

    };

    FingerBone.prototype.create = function () {

        this.createTHREE();
        this.createCANNON();

    };

    FingerBone.prototype.createTHREE = function () {

        var radiusTop    = this.params.radiusTop;
        var radiusBottom = this.params.radiusBottom;
        var length       = this.leapBone.length;
        var numSegments  = this.params.numSegments;

        var handBoneMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(radiusTop, radiusBottom, length, numSegments),
            new THREE.MeshPhongMaterial()
        );

        handBoneMesh.material.color.setHex(0xffffff);

        this.three = handBoneMesh;

    };

    FingerBone.prototype.createCANNON = function () {

        var radiusTop    = this.params.radiusTop;
        var radiusBottom = this.params.radiusBottom;
        var length       = this.leapBone.length;
        var numSegments  = this.params.numSegments;

        var handBoneShape = new CANNON.Cylinder(radiusTop, radiusBottom, length, numSegments);

        var handBoneBody = new CANNON.Body({mass: 1, material: new CANNON.Material()});
            handBoneBody.addShape(handBoneShape);

        this.cannon = handBoneBody;

    };

    FingerBone.prototype.update = function () {

        this.three.position.copy(this.cannon.position);
        this.three.quaternion.copy(this.cannon.quaternion);

    };

    LeapHand.FingerBone = FingerBone;

})();



(function () {

    var Finger = function (leapFinger) {

        this.init(leapFinger);

    };

    Finger.prototype.init = function (leapFinger) {

        this.leapFinger = leapFinger;

        this.bones  = [];
        this.joints = [];

        this.create();


    };

    Finger.prototype.create = function () {

        var self = this;

        var finger = this.leapFinger;

        finger.bones.forEach(function (bone) {

            self.createBone(bone);
            self.createJoint();

        });

    };

    Finger.prototype.createBone = function (leapBone) {

        var bones = this.bones;

        var bone = new LeapHand.FingerBone(leapBone);

        bones.push(bone);

    };

    Finger.prototype.createJoint = function () {

        var joints = this.joints;

        var joint = new LeapHand.FingerJoint();

        joints.push(joint);

    };

    Finger.prototype.update = function () {

        this.updateBones();
        this.updateJoints();

    };

    Finger.prototype.updateJoints = function () {

        var joints = this.joints;

        joints.forEach(function (joint) {

            joint.update();

        });

    };

    Finger.prototype.updateBones = function () {

        var bones = this.bones;

        bones.forEach(function (bone) {

            bone.update();

        });

    };

    LeapHand.Finger = Finger;

})();

(function () {

    var Hand = function (leapHand) {

        this.init(leapHand);

    };

    Hand.prototype.init = function (leapHand) {

        this.leapHand = leapHand;

        this.fingers = [];

        this.create();

    };

    Hand.prototype.create = function () {

        var self = this;

        var hand = this.leapHand;

        hand.fingers.forEach(function (finger) {

            self.createFinger(finger);

        })

    };

    Hand.prototype.createFinger = function (leapFinger) {

        var fingers = this.fingers;

        var finger = new LeapHand.Finger(leapFinger);

        fingers.push(finger);

    };

    Hand.prototype.update = function () {

        var fingers = this.fingers;

        fingers.forEach(function (finger) {

            finger.update();

        })

    };

    LeapHand.Hand = Hand;

})();

(function () {

    var HandManager = function (scene, world) {

        this.init(scene, world);

    };

    HandManager.prototype.init = function (scene, world) {

        this.scene = scene;

        this.world = world;

        this.hand = null;

    };

    HandManager.prototype.add = function (hand) {

        if( !(hand instanceof LeapHand.Hand) ) hand = new LeapHand.Hand(hand);

        this.hand = hand;

        this.manipulation(hand, 'add');

    };

    HandManager.prototype.update = function (leapHand) {

        this.setNewCoordinates(leapHand);
        this.hand.update();

    };

    HandManager.prototype.remove = function () {

        var hand = this.hand;

        this.manipulation(hand, 'remove');

    };

    HandManager.prototype.manipulation = function (hand, method) {

        var scene = this.scene;
        var world = this.world;


        hand.fingers.forEach(function (fingers) {

            fingers.bones.forEach(function (bone) {

                scene[method](bone.three);
                world[method](bone.cannon);

            });

            fingers.joints.forEach(function (joint) {

                scene[method](joint.three);
                world[method](joint.cannon);

            });

        });

    };

    HandManager.prototype.setNewCoordinates = function(leapHand) {

        var hand = this.hand;

        hand.fingers.forEach(function (finger, i) {

            var leapFinger = leapHand.fingers[i];

            finger.bones.forEach(function (bone, j) {

                var leapBone = leapFinger.bones[j];

                var leapBonePosition = leapBone.center();
                var x = leapBonePosition[0],
                    y = leapBonePosition[1],
                    z = leapBonePosition[2];

                bone.cannon.position.set(x, y, z);

                var baseBoneRotation = ( new THREE.Quaternion ).setFromEuler( new THREE.Euler( Math.PI / 2, 0, 0 ) );

                var quaternion = new THREE.Quaternion();
                    quaternion.setFromRotationMatrix((new THREE.Matrix4).fromArray(leapBone.matrix()));
                    quaternion.multiply(baseBoneRotation);

                bone.cannon.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);

            });

        });

    };

    LeapHand.HandManager = HandManager;

})();