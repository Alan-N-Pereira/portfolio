
(function () {
    function initAnimatedTiles(scene, map) {
        const animatedTiles = [];

        map.tilesets.forEach((tileset) => {
            const tileData = tileset.tileData;
            Object.keys(tileData).forEach((index) => {
                index = parseInt(index);
                if (tileData[index].hasOwnProperty("animation")) {
                    const frames = tileData[index].animation.map((frame) => ({
                        duration: frame.duration,
                        tileid: frame.tileid + tileset.firstgid
                    }));

                    const currentFrame = frames.findIndex(f => f.tileid === index + tileset.firstgid);
                    const animatedTile = {
                        index: index + tileset.firstgid,
                        frames: frames,
                        currentFrame: currentFrame >= 0 ? currentFrame : 0,
                        next: frames[0].duration,
                        tiles: []
                    };

                    map.layers.forEach((layer) => {
                        const tiles = [];
                        layer.data.forEach((row) => {
                            row.forEach((tile) => {
                                if (tile && tile.index === animatedTile.index) {
                                    tiles.push(tile);
                                }
                            });
                        });
                        animatedTile.tiles.push(tiles);
                    });

                    animatedTiles.push(animatedTile);
                }
            });
        });

        scene.events.on('postupdate', (time, delta) => {
            animatedTiles.forEach((animatedTile) => {
                animatedTile.next -= delta;
                if (animatedTile.next <= 0) {
                    animatedTile.currentFrame = (animatedTile.currentFrame + 1) % animatedTile.frames.length;
                    animatedTile.next = animatedTile.frames[animatedTile.currentFrame].duration;
                    const newIndex = animatedTile.frames[animatedTile.currentFrame].tileid;
                    animatedTile.tiles.forEach((layer) => {
                        layer.forEach((tile) => {
                            tile.index = newIndex;
                        });
                    });
                }
            });
        });
    }

    if (typeof window !== 'undefined') {
        window.animatedTiles = {
            init: initAnimatedTiles
        };
    }
})();
