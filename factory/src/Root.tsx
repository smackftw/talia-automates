import React from "react";
import { Composition } from "remotion";
import batch from "../current-batch.json";
import { CarouselSlide } from "./carousel/CarouselSlide";
import { FactoryReel } from "./reel/FactoryReel";

export const Root: React.FC = () => {
  const carousels = batch.items.filter((item) => item.type === "carousel");
  const reel = batch.items.find((item) => item.type === "reel");
  return (
    <>
      {carousels.flatMap((item, itemIndex) =>
        item.slides?.map((slide, slideIndex) => (
          <Composition
            key={`Carousel-${itemIndex + 1}-${slideIndex + 1}`}
            id={`Carousel-${itemIndex + 1}-${slideIndex + 1}`}
            component={CarouselSlide}
            fps={30}
            width={1080}
            height={1350}
            durationInFrames={60}
            defaultProps={{
              slide,
              slideIndex,
              slideCount: item.slides?.length || 3,
            }}
          />
        )),
      )}
      {reel ? (
        <Composition
          id="WeeklyReel"
          component={FactoryReel}
          fps={30}
          width={1080}
          height={1920}
          durationInFrames={900}
          defaultProps={{ item: reel }}
        />
      ) : null}
    </>
  );
};
