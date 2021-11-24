import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';

const BetaWelcomeFooter = () => {
  const t = useI18nContext();

  return (
    <>
      <div className="welcome-page__header">{t('betaWelcome')}</div>
      <div className="welcome-page__description">
        <p>{t('betaMisesWalletDescription')}</p>
        <p>
          {t('betaMisesWalletDescriptionExplanation', [
            <a href="https://metamask.io/terms.html" key="terms-link">
              {t('betaMisesWalletDescriptionExplanationTermsLinkText')}
            </a>,
            <a href="https://metamask.io/beta-terms.html" key="beta-terms-link">
              {t('betaMisesWalletDescriptionExplanationBetaTermsLinkText')}
            </a>,
          ])}
        </p>
      </div>
    </>
  );
};

export default BetaWelcomeFooter;
