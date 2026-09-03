import React, { useState } from "react";
import { Carousel } from "@mantine/carousel";
import { Image } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import silver from "../../assets/silver.webp";
import gold from "../../assets/gold.webp";
import platinum from "../../assets/plat.webp";
import "./Subscriptions.css";

const Subscriptions: React.FC = () => {
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery("(max-width: 600px)");
  const isMediumScreen = useMediaQuery("(max-width: 1024px)");
  const slideSize = isSmallScreen ? "100%" : isMediumScreen ? "50%" : "33.333%";
  const [activeSlide, setActiveSlide] = useState(0);
  const plans = [
    { plan: "Silver", imageSrc: silver },
    { plan: "Gold", imageSrc: gold },
    { plan: "Platinum", imageSrc: platinum },
  ];

  const handleSubscribe = async (plan: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    } else {
      window.location.href = "https://store.ovrp.in/category/2829893";
    }
  };

  return (
    <div className="subscriptions">
      <div className="subscriptions-title">SUBSCRIPTIONS</div>
      <div className="subscriptions-desc">
        Pick your membership and unlock countless benefits to explore the city!
      </div>

      <div className="coming-soon-container">
        <span className="coming-soon-badge">COMING SOON</span>
        <p className="coming-soon-text">
          Membership plans are being revamped. Stay tuned for something amazing!
        </p>
      </div>

      {/* Membership cards temporarily disabled
      <Carousel
        slideSize={slideSize}
        slideGap={{ base: 0, sm: 'md' }}
        align="start"
        withControls
        onSlideChange={(index) => setActiveSlide(index)}
        onNextSlide={() => setActiveSlide((prev) => Math.min(prev + 1, plans.length - 1))}
        onPreviousSlide={() => setActiveSlide((prev) => Math.max(prev - 1, 0))}
        nextControlIcon={<IconArrowRight size={15} />}
        previousControlIcon={<IconArrowLeft size={15} />}
        classNames={{
          control: 'carousel-control',
        }}
      >
        {plans.map((plan, index) => (
          <Carousel.Slide key={index}>
            <div className="subscription-card">
              <Image
                src={plan.imageSrc}
                alt={`${plan.plan} Plan`}
                className="subscription-img"
                radius="md"
              />
              <button className="sub-button"
                onClick={() => handleSubscribe(plan.plan)}>
                Subscribe
                <span className="ping-effect"></span>
              </button>
            </div>
          </Carousel.Slide>
        ))}
      </Carousel>
      */}
    </div>
  );
};

export default Subscriptions;