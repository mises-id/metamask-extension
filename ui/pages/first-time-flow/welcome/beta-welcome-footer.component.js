/*
 * @Author: lmk
 * @Date: 2022-01-18 17:59:56
 * @LastEditTime: 2022-03-18 13:34:21
 * @LastEditors: lmk
 * @Description:
 */
import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';

const BetaWelcomeFooter = () => {
  const t = useI18nContext();

  return (
    <>
      <div className="welcome-page__header">{t('betaWelcome')}</div>
      <div className="welcome-page__description">
        <p>{t('betaMetamaskDescription')}</p>
        <p>
          {t('betaMetamaskDescriptionExplanation', [
            <a href="https://www.mises.site/teamsofuse" key="terms-link">
              {t('betaMetamaskDescriptionExplanationTermsLinkText')}
            </a>,
            <a href="https://metamask.io/beta-terms.html" key="beta-terms-link">
              {t('betaMetamaskDescriptionExplanationBetaTermsLinkText')}
            </a>,
          ])}
        </p>
      </div>
    </>
  );
};

export default BetaWelcomeFooter;
